const chokidar = require('chokidar');
const path = require('path');
const GptCompiler = require('./compiler');

/**
 * GPT File Watcher - Watches for changes in .gpt files and triggers compilation
 */
class GptWatcher {
  constructor(watchPath = '.') {
    this.watchPath = watchPath;
    this.compiler = new GptCompiler();
    this.watcher = null;
  }

  /**
   * Start watching .gpt files
   */
  start() {
    console.log(`Watching for .gpt files in: ${path.resolve(this.watchPath)}`);
    
    // Initialize watcher
    this.watcher = chokidar.watch('**/*.gpt', {
      cwd: this.watchPath,
      ignoreInitial: false,
      persistent: true
    });

    // Setup event handlers
    this.watcher
      .on('add', filepath => this.handleFileChange('add', filepath))
      .on('change', filepath => this.handleFileChange('change', filepath))
      .on('error', error => console.error(`Watcher error: ${error}`));
      
    console.log('GPT Compiler is running. Press Ctrl+C to stop.');
  }

  /**
   * Stop watching files
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      console.log('GPT Compiler stopped');
    }
  }

  /**
   * Handle file change events
   * @param {string} event - Event type (add, change)
   * @param {string} filepath - Relative path to the changed file
   */
  async handleFileChange(event, filepath) {
    if (!filepath.endsWith('.gpt')) return;
    
    const absolutePath = path.resolve(this.watchPath, filepath);
    console.log(`File ${event}: ${absolutePath}`);
    
    try {
      await this.compiler.processFile(absolutePath);
    } catch (error) {
      console.error(`Error processing file: ${error.message}`);
    }
  }
}

module.exports = GptWatcher; 