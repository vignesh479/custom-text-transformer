# Custom Text Transformer

A powerful VS Code extension that allows you to transform selected text using custom JavaScript transformations. Define your own text processing tasks and execute them with a simple command or keyboard shortcut.Supports Multiple transformation tasks from a single file

## Features

- **Custom Transformations**: Define JavaScript functions to transform selected text
- **Multiple Task Support**: Load multiple transformation tasks from a single file
- **Quick Access**: Use Command Palette or keyboard shortcuts

## Installation

1. Install the extension from VS Code Marketplace
2. Create an executor file (`.js`) with your transformation tasks
3. Configure the executor path in VS Code settings

## Quick Start

### 1. Create an Executor File

Create a JavaScript file (e.g., `transformers.js`) with your transformation tasks:

```javascript
// transformers.js
module.exports = {
  tasks: [
    {
      name: "Uppercase",
      description: "Convert text to uppercase",
      transform: function(text, context) {
        return text.toUpperCase();
      }
    },
    {
      name: "Remove Spaces",
      description: "Remove all spaces from text",
      transform: (text, context) => {
        return text.replace(/\s+/g, '');
      }
    },
    {
      name: "Word Count",
      description: "Replace text with word count",
      transform: function(text, context) {
        return 'Word count: ' + text.split(/\s+/).length;
      }
    }
  ]
};
```

### 2. Configure Settings

Add to your VS Code settings (`.vscode/settings.json`):

```json
{
  "custom-text-transformer.executor": "./transformers.js"
}
```

### 3. Use the Extension

1. Select text in any editor
2. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
3. Run `CustomTransformer: Select custom task and transform`(`Ctrl+alt+h` / `Cmd+Shift+h`)
4. Choose your transformation from the list

## Executor File Formats

### JavaScript Format

```javascript
module.exports = {
  tasks: [
    {
      name: "Task Name",
      description: "Optional description",
      transform: function(text, context) {
        return text.toUpperCase(); // Your transformation logic
      }
    }
  ]
};
```

## Transform Function Context

Your transform functions receive these parameters:

- `text`: The selected text string
- `context`: Object with the following properties
  - `startLine`: number; // starting line of the selection
  -	`startCharacter`: number; // starting character number of the selection
  -	`endLine`: number; // ending line of the selection
  -	`endCharacter`: number; // ending character number of the selection
  - `fileName`: string; // file name of the selection

Example:
```javascript
{
  name: "Add Timestamp",
  transform: function(text, context) {
    const now = new Date().toISOString();
    return text + ' // Added on ' + now;
  }
}
```

## Commands

| Command | Description | Default Keybinding |
|---------|-------------|-------------------|
| `custom-text-transformer.selectAndTransform` | Select and execute a transformation | `Shift+Cmd+H` (Mac), `Ctrl+Alt+h+` |

## Extension Settings

This extension contributes the following settings:

* `custom-text-transformer.executor`: Path to the JavaScript file containing transformation tasks. Can be absolute or relative to workspace root.

## Example Use Cases

- **Code Formatting**: Custom formatters for specific patterns
- **Text Processing**: Clean up data, convert formats
- **Template Generation**: Generate boilerplate code from selections
- **Data Transformation**: Convert between JSON/CSV/XML formats
- **String Manipulation**: Advanced find/replace operations

## Development

### Debugging

Use `console.log()` in your transformations to debug. Output appears in the VS Code Developer Console.


## Release Notes

### 0.1.0

- Initial release
- Support for JavaScript executor files
- Secure VM2 execution environment
- Command palette integration
- Keyboard shortcuts

## Contributing

Issues and feature requests are welcome! Please visit the [GitHub repository](https://github.com/vignesh479/custom-text-transformer) to contribute.

## License

This extension is available under the MIT License.
