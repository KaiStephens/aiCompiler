# GPT Compiler

A command-line tool that compiles English instructions in `.gpt` files into code using AI through the OpenRouter API.

## Installation

```bash
# Clone the repository
git clone https://github.com/YourUsername/gpt-compiler.git
cd gpt-compiler

# Install dependencies
npm install

# Make the CLI globally available (optional)
npm link
```

## Configuration

Before using the GPT Compiler, you need to set up your OpenRouter API key:

1. Create an account at [OpenRouter](https://openrouter.ai/) if you don't have one
2. Get your API key from the OpenRouter dashboard
3. Add your API key to the `.env` file:

```
OPENROUTER_API_KEY=your_api_key_here
AI_MODEL=your_preferred_model
DEFAULT_OUTPUT_LANG=python
```

Available models include:
- `openai/gpt-4-turbo`
- `anthropic/claude-3-opus-20240229`
- `anthropic/claude-3-sonnet`
- `mistralai/mistral-large-latest`
- And [many more](https://openrouter.ai/docs)

## Usage

### Creating a new .gpt file

```bash
# Create a new .gpt file with a template
gpt-compiler new myprogram

# Specify a different language
gpt-compiler new myprogram --lang javascript
```

### File Format

GPT files use a simple format:

```
@language: python
@output: output_filename.py

Write your English instructions here.
The instructions should describe what code you want to generate.
```

### Compiling a .gpt file

```bash
# Compile a single .gpt file
gpt-compiler compile path/to/file.gpt
```

### Watching for changes

```bash
# Watch the current directory for .gpt file changes
gpt-compiler watch

# Watch a specific directory
gpt-compiler watch path/to/directory
```

## Example

Example `.gpt` file:

```
@language: python
@output: hello.py

Create a simple Python program that:
1. Prints "Hello, GPT Compiler!" to the console
2. Defines a function called 'greet' that takes a name parameter
3. Calls the greet function with a few different names
```

Run: `gpt-compiler compile examples/hello.gpt`

## License

ISC 