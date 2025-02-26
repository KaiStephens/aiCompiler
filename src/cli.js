#!/usr/bin/env node

const { program } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const GptCompiler = require('./compiler');
const GptWatcher = require('./watcher');
const packageJson = require('../package.json');

// Setup CLI program
program
  .name('gpt-compiler')
  .description('Compile English to code using AI')
  .version(packageJson.version || '1.0.0');

// Command to compile a single file
program
  .command('compile')
  .description('Compile a single .gpt file to code')
  .argument('<file>', '.gpt file to compile')
  .action(async (file) => {
    try {
      const filePath = path.resolve(process.cwd(), file);
      
      if (!fs.existsSync(filePath)) {
        console.error(`Error: File not found: ${filePath}`);
        process.exit(1);
      }
      
      if (!filePath.endsWith('.gpt')) {
        console.error('Error: Only .gpt files can be compiled');
        process.exit(1);
      }
      
      console.log(`Compiling file: ${filePath}`);
      const compiler = new GptCompiler();
      await compiler.processFile(filePath);
    } catch (error) {
      console.error('Compilation failed:', error.message);
      process.exit(1);
    }
  });

// Command to watch a directory for .gpt files
program
  .command('watch')
  .description('Watch for changes in .gpt files and compile them')
  .argument('[dir]', 'Directory to watch', '.')
  .action((dir) => {
    try {
      const watchPath = path.resolve(process.cwd(), dir);
      
      if (!fs.existsSync(watchPath)) {
        console.error(`Error: Directory not found: ${watchPath}`);
        process.exit(1);
      }
      
      const watcher = new GptWatcher(watchPath);
      watcher.start();
      
      // Handle termination signals
      process.on('SIGINT', () => {
        watcher.stop();
        process.exit(0);
      });
      
      process.on('SIGTERM', () => {
        watcher.stop();
        process.exit(0);
      });
    } catch (error) {
      console.error('Watch failed:', error.message);
      process.exit(1);
    }
  });

// Create a new .gpt file with template
program
  .command('new')
  .description('Create a new .gpt file with template')
  .argument('<file>', 'Name of the file to create')
  .option('-l, --lang <language>', 'Target language', 'python')
  .action((file, options) => {
    try {
      let filePath = file;
      if (!filePath.endsWith('.gpt')) {
        filePath += '.gpt';
      }
      
      filePath = path.resolve(process.cwd(), filePath);
      
      if (fs.existsSync(filePath)) {
        console.error(`Error: File already exists: ${filePath}`);
        process.exit(1);
      }
      
      const template = `@language: ${options.lang}
@output: ${path.basename(filePath, '.gpt')}.${options.lang === 'javascript' ? 'js' : options.lang === 'python' ? 'py' : 'txt'}

Create a simple program that does the following:
1. 
2. 
3. 

`;
      
      fs.writeFileSync(filePath, template);
      console.log(`Created new file: ${filePath}`);
    } catch (error) {
      console.error('Failed to create new file:', error.message);
      process.exit(1);
    }
  });

// Parse CLI arguments
program.parse(); 