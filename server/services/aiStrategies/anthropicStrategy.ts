import Anthropic from '@anthropic-ai/sdk';

interface AnthropicConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  maxTokens?: number;
  toolsEndpoint?: string;
}

interface ModelCapabilities {
  tier: string;
  contextWindow: number;
  strengths: string[];
  costTier: string;
}

interface ModelInfo {
  provider: string;
  model: string;
  maxTokens: number;
  capabilities: ModelCapabilities;
}

class AnthropicStrategy {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private toolsEndpoint?: string;

  constructor(config: AnthropicConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.anthropic.com'
    });
    this.model = config.model || 'claude-3-sonnet-20240229';
    this.maxTokens = config.maxTokens || 2000;
    this.toolsEndpoint = config.toolsEndpoint;
  }

  async generateResponse(prompt: string, tools?: Anthropic.Tool[]): Promise<string> {
    try {
      console.log(`🤖 AnthropicStrategy.generateResponse() called with model: ${this.model}`);
      console.log(`🤖 Prompt length: ${prompt.length} characters`);
      if (tools && tools.length > 0) {
        console.log(`🔧 Using ${tools.length} tools for enhanced analysis`);
      }
      
      const messages: Anthropic.MessageParam[] = [{
        role: 'user',
        content: prompt
      }];

      const messageParams: Anthropic.MessageCreateParams = {
        model: this.model,
        max_tokens: this.maxTokens,
        messages
      };

      // Only add tools if there are actually tools available
      if (tools && tools.length > 0) {
        messageParams.tools = tools;
        const toolNames = tools.map(tool => tool.name).join(', ');
        console.log(`🔧 Adding ${tools.length} tools to API request: [${toolNames}]`);
      } else {
        console.log(`🔧 No tools provided, making request without tools`);
      }

      console.log(`🔧 API request parameters:`, {
        model: messageParams.model,
        max_tokens: messageParams.max_tokens,
        messages: `${messageParams.messages.length} messages`,
        tools: messageParams.tools ? `${messageParams.tools.length} tools` : 'none'
      });

      let response = await this.client.messages.create(messageParams);
      
      // Handle tool calls if they occur
      while (response.stop_reason === 'tool_use') {
        const toolUseBlocks = response.content.filter((block): block is Anthropic.ToolUseBlock => 
          block.type === 'tool_use'
        );
        
        console.log(`🔧 Claude requested ${toolUseBlocks.length} tool calls`);
        
        // Add assistant's response with tool use to conversation
        messages.push({
          role: 'assistant',
          content: response.content
        });

        // Process each tool call and add results
        const toolResults: Anthropic.ToolResultBlockParam[] = [];
        
        for (const toolUse of toolUseBlocks) {
          console.log(`🔧 Executing tool: ${toolUse.name} with input:`, toolUse.input);
          
          try {
            const result = await this.executeToolCall(toolUse.name, toolUse.input);
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: JSON.stringify(result)
            });
          } catch (error: any) {
            console.error(`🔧 Tool execution failed for ${toolUse.name}:`);
            console.error(`   Tool Name: ${toolUse.name}`);
            console.error(`   Tool Input:`, toolUse.input);
            console.error(`   Error Message: ${error.message}`);
            console.error(`   Error Name: ${error.name}`);
            console.error(`   Error Stack:`, error.stack);
            if (error.cause) console.error(`   Error Cause:`, error.cause);
            if (error.code) console.error(`   Error Code: ${error.code}`);
            console.error(`   Full Error Object:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            
            const detailedError = `${error.message} | Name: ${error.name} | Code: ${error.code || 'N/A'}`;
            toolResults.push({
              type: 'tool_result',
              tool_use_id: toolUse.id,
              content: `Error: ${detailedError}`,
              is_error: true
            });
          }
        }

        // Add tool results to conversation
        messages.push({
          role: 'user',
          content: toolResults
        });

        // Get next response from Claude
        response = await this.client.messages.create({
          ...messageParams,
          messages
        });
      }

      // Extract final text response
      const textBlocks = response.content.filter((block): block is Anthropic.TextBlock => 
        block.type === 'text'
      );
      
      if (textBlocks.length > 0) {
        return textBlocks.map(block => block.text).join('\n');
      }
      
      throw new Error('No text content in response from Anthropic API');
    } catch (error: any) {
      console.error('🤖 Anthropic API error:');
      console.error(`   Error Message: ${error.message}`);
      console.error(`   Error Name: ${error.name}`);
      console.error(`   Error Stack:`, error.stack);
      if (error.cause) console.error(`   Error Cause:`, error.cause);
      if (error.code) console.error(`   Error Code: ${error.code}`);
      if (error.status) console.error(`   HTTP Status: ${error.status}`);
      if (error.headers) console.error(`   Response Headers:`, error.headers);
      console.error(`   Model: ${this.model}`);
      console.error(`   Max Tokens: ${this.maxTokens}`);
      console.error(`   Prompt Length: ${prompt.length}`);
      console.error(`   Full Error Object:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      throw new Error(`Anthropic API failed: ${error.message} | Name: ${error.name} | Code: ${error.code || 'N/A'}`);
    }
  }

  getModelInfo(): ModelInfo {
    return {
      provider: 'anthropic',
      model: this.model,
      maxTokens: this.maxTokens,
      capabilities: this.getModelCapabilities()
    };
  }

  getModelCapabilities(): ModelCapabilities {
    const capabilities: Record<string, ModelCapabilities> = {
      'claude-3-opus-20240229': {
        tier: 'premium',
        contextWindow: 200000,
        strengths: ['Complex reasoning', 'Creative writing', 'Analysis'],
        costTier: 'high'
      },
      'claude-3-sonnet-20240229': {
        tier: 'balanced',
        contextWindow: 200000,
        strengths: ['Balanced performance', 'Good reasoning', 'Efficient'],
        costTier: 'medium'
      },
      'claude-3-haiku-20240307': {
        tier: 'fast',
        contextWindow: 200000,
        strengths: ['Speed', 'Low cost', 'Simple tasks'],
        costTier: 'low'
      },
      'claude-sonnet-4-20250514': {
        tier: 'latest',
        contextWindow: 200000,
        strengths: ['Latest features', 'Enhanced reasoning', 'Improved accuracy'],
        costTier: 'premium'
      }
    };

    return capabilities[this.model] || {
      tier: 'unknown',
      contextWindow: 200000,
      strengths: ['General purpose'],
      costTier: 'medium'
    };
  }

  validateModel(model: string): boolean {
    const supportedModels = [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229', 
      'claude-3-haiku-20240307',
      'claude-sonnet-4-20250514'
    ];

    return supportedModels.includes(model);
  }

  async getAvailableTools(): Promise<Anthropic.Tool[]> {
    if (!this.toolsEndpoint) {
      console.log('🔧 No tools endpoint configured');
      return [];
    }

    try {
      console.log(`🔧 Fetching tools from endpoint: ${this.toolsEndpoint}`);
      const response = await fetch(this.toolsEndpoint);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`🔧 Tools endpoint HTTP error:`);
        console.error(`   Status: ${response.status}`);
        console.error(`   Status Text: ${response.statusText}`);
        console.error(`   Response Headers:`, Object.fromEntries(response.headers.entries()));
        console.error(`   Response Body: ${errorText}`);
        console.error(`   Request URL: ${this.toolsEndpoint}`);
        throw new Error(`Tools endpoint returned ${response.status}: ${response.statusText} | Body: ${errorText}`);
      }
      
      const data = await response.json();
      console.log(`🔧 Raw tools data received:`, data);
      
      let toolStrings: string[] = [];
      
      // Handle different response formats
      if (Array.isArray(data)) {
        toolStrings = data;
      } else if (data.tools && Array.isArray(data.tools)) {
        toolStrings = data.tools;
      } else {
        console.warn('🔧 Unknown tools format, expected array or object with tools property');
        return [];
      }
      
      console.log(`🔧 Found ${toolStrings.length} tool definitions: [${toolStrings.join(', ')}]`);
      
      // Transform string descriptions into proper Anthropic.Tool format
      const anthropicTools: Anthropic.Tool[] = toolStrings.map(toolString => {
        // Parse tool name from string like "TestConnectionTool - Verify access to..."
        const [toolName, ...descriptionParts] = toolString.split(' - ');
        const description = descriptionParts.join(' - ') || 'Tool from MCP server';
        
        return {
          name: toolName.trim(),
          description: description.trim(),
          input_schema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Input for the tool'
              }
            },
            required: []
          }
        };
      });
      
      console.log(`🔧 Transformed ${anthropicTools.length} tools for Claude API:`, 
                  anthropicTools.map(t => t.name));
      
      return anthropicTools;
    } catch (error: any) {
      console.error('🔧 Failed to fetch tools from MCP server:');
      console.error(`   Tools Endpoint: ${this.toolsEndpoint}`);
      console.error(`   Error Message: ${error.message}`);
      console.error(`   Error Name: ${error.name}`);
      console.error(`   Error Stack:`, error.stack);
      if (error.cause) console.error(`   Error Cause:`, error.cause);
      if (error.code) console.error(`   Error Code: ${error.code}`);
      if (error.response) {
        console.error(`   HTTP Response Status: ${error.response.status}`);
        console.error(`   HTTP Response Text: ${error.response.statusText}`);
      }
      console.error(`   Full Error Object:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      return [];
    }
  }

  private async executeToolCall(toolName: string, input: any): Promise<any> {
    console.log(`🔧 Executing tool: ${toolName} via MCP server`);
    
    // Tool execution should be delegated to the MCP server
    // This is a placeholder that should be replaced with actual MCP server communication
    if (!this.toolsEndpoint) {
      throw new Error('No tools endpoint configured for tool execution');
    }
    
    try {
      const response = await fetch(`${this.toolsEndpoint}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          toolName,
          input
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`🔧 Tool execution HTTP error:`);
        console.error(`   Tool Name: ${toolName}`);
        console.error(`   Tool Input:`, input);
        console.error(`   Status: ${response.status}`);
        console.error(`   Status Text: ${response.statusText}`);
        console.error(`   Response Headers:`, Object.fromEntries(response.headers.entries()));
        console.error(`   Response Body: ${errorText}`);
        console.error(`   Request URL: ${this.toolsEndpoint}/execute`);
        throw new Error(`Tool execution failed: ${response.status} ${response.statusText} | Body: ${errorText}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error(`🔧 Tool execution failed for ${toolName}:`);
      console.error(`   Tool Name: ${toolName}`);
      console.error(`   Tool Input:`, input);
      console.error(`   Tools Endpoint: ${this.toolsEndpoint}`);
      console.error(`   Error Message: ${error.message}`);
      console.error(`   Error Name: ${error.name}`);
      console.error(`   Error Stack:`, error.stack);
      if (error.cause) console.error(`   Error Cause:`, error.cause);
      if (error.code) console.error(`   Error Code: ${error.code}`);
      console.error(`   Full Error Object:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      throw new Error(`Tool execution failed: ${error.message} | Name: ${error.name} | Code: ${error.code || 'N/A'}`);
    }
  }
}

export default AnthropicStrategy;