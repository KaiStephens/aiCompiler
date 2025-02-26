const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

/**
 * GPT Compiler - Converts English instructions to code using AI
 */
class GptCompiler {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.AI_MODEL || 'anthropic/claude-3-opus-20240229';
    this.defaultLang = process.env.DEFAULT_OUTPUT_LANG || 'javascript';
    
    if (!this.apiKey) {
      console.error('Error: OPENROUTER_API_KEY is not set in your .env file');
      process.exit(1);
    }
  }

  /**
   * Parse the .gpt file to extract metadata and instructions
   * @param {string} content - Content of the .gpt file
   * @returns {Object} Parsed metadata and instructions
   */
  parseGptFile(content) {
    const lines = content.split('\n');
    const metadata = {};
    let instructionsStartIndex = 0;

    // Look for metadata at the start of the file (format: @key: value)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('@')) {
        const match = line.match(/@([a-zA-Z0-9_]+):\s*(.*)/);
        if (match) {
          metadata[match[1]] = match[2].trim();
        }
      } else if (line === '' && Object.keys(metadata).length > 0) {
        // Empty line after metadata section
        instructionsStartIndex = i + 1;
        break;
      } else {
        // No metadata or end of metadata section
        break;
      }
    }

    // Extract instructions (everything after metadata)
    const instructions = lines.slice(instructionsStartIndex).join('\n');

    return {
      metadata,
      instructions,
      outputLang: metadata.language || this.defaultLang,
      outputFile: metadata.output || null
    };
  }

  /**
   * Compile English instructions to code using OpenRouter API
   * @param {string} instructions - English instructions to compile
   * @param {string} language - Target programming language
   * @returns {Promise<string>} Generated code
   */
  async compileToCode(instructions, language) {
    try {
      console.log(`Compiling to ${language}...`);
      console.log(`Using model: ${this.model}`);
      
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: `You are an expert programmer specializing in ${language}. 
                        Your task is to convert English instructions into well-structured, efficient, 
                        and commented ${language} code. 
                        Only respond with the code - no explanations, no markdown formatting.`
            },
            {
              role: 'user',
              content: instructions
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': 'https://github.com/KaiStephens/aiCompiler', // Replace with your actual URL
            'X-Title': 'AI GPT Compiler'
          }
        }
      );

      // Log the response structure
      console.log('API response received:');
      console.log('Response status:', response.status);
      console.log('Response structure:', JSON.stringify(Object.keys(response.data), null, 2));
      
      let generatedCode = '';
      
      if (response.data) {
        // Handle different response formats from different providers
        if (response.data.choices && response.data.choices.length > 0) {
          // OpenAI-style response
          console.log('Found OpenAI-style response format');
          const choiceContent = response.data.choices[0].message?.content;
          console.log('Choice content type:', typeof choiceContent);
          console.log('Choice content length:', choiceContent ? choiceContent.length : 0);
          
          if (choiceContent) {
            generatedCode = choiceContent.trim();
          } else {
            console.log('Full choice object:', JSON.stringify(response.data.choices[0], null, 2));
          }
        } else if (response.data.output && response.data.output.content) {
          // Some models might use a different structure
          console.log('Found alternative response format with output.content');
          generatedCode = response.data.output.content.trim();
        } else if (response.data.content) {
          // Simple content property
          console.log('Found simple content property in response');
          generatedCode = response.data.content.trim();
        } else {
          // Log the entire response data for debugging
          console.log('Full response data:', JSON.stringify(response.data, null, 2));
          throw new Error('No recognized content format in the response');
        }
        
        // Final check for content
        if (!generatedCode || generatedCode.length === 0) {
          console.log('Warning: Generated code is empty. Checking full response data for any content.');
          console.log('Full response data:', JSON.stringify(response.data, null, 2));
          throw new Error('Empty code was generated');
        }
        
        console.log(`Generated code length: ${generatedCode.length} characters`);
        return generatedCode;
      } else {
        throw new Error('No data in the response');
      }
    } catch (error) {
      console.error('Error compiling code:', error.message);
      if (error.response) {
        console.error('API response error details:', error.response.status);
        console.error('API response error data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }

  /**
   * Process a .gpt file and generate code output
   * @param {string} filePath - Path to the .gpt file
   * @returns {Promise<Object>} Result of the compilation process
   */
  async processFile(filePath) {
    try {
      console.log(`Processing file: ${filePath}`);
      const content = await fs.readFile(filePath, 'utf8');
      const { metadata, instructions, outputLang, outputFile } = this.parseGptFile(content);
      
      // Determine output file path
      const outputPath = outputFile 
        ? path.resolve(path.dirname(filePath), outputFile)
        : filePath.replace(/\.gpt$/, `.${this.getFileExtension(outputLang)}`);
      
      // Compile the instructions to code
      const code = await this.compileToCode(instructions, outputLang);
      
      // Save the generated code
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, code);
      
      console.log(`✅ Code generated successfully: ${outputPath}`);
      return {
        success: true,
        outputPath,
        language: outputLang
      };
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get the file extension for a given programming language
   * @param {string} language - Programming language
   * @returns {string} File extension
   */
  getFileExtension(language) {
    const extensions = {
      'javascript': 'js',
      'typescript': 'ts',
      'python': 'py',
      'java': 'java',
      'c#': 'cs',
      'csharp': 'cs',
      'c++': 'cpp',
      'cpp': 'cpp',
      'c': 'c',
      'go': 'go',
      'rust': 'rs',
      'ruby': 'rb',
      'php': 'php',
      'swift': 'swift',
      'kotlin': 'kt',
      'html': 'html',
      'css': 'css'
    };
    
    return extensions[language.toLowerCase()] || 'txt';
  }
}

module.exports = GptCompiler; 