# CSV to JSON Converter

A simple Python script to convert CSV files to JSON format.

## Features

- Converts CSV files to JSON format
- Handles UTF-8 encoding
- Supports pretty-printed and compact JSON output
- Provides error handling for common issues
- Command-line interface

## Usage

### Basic Conversion

```bash
python csv_to_json.py input.csv output.json
```

### Compact JSON Output

```bash
python csv_to_json.py input.csv output.json --compact
```

## Example

Given a CSV file named `data.csv`:

```csv
name,age,city,occupation
John Doe,30,New York,Engineer
Jane Smith,25,Los Angeles,Designer
```

Running the command:
```bash
python csv_to_json.py data.csv data.json
```

Will produce a JSON file `data.json`:
```json
[
  {
    "name": "John Doe",
    "age": "30",
    "city": "New York",
    "occupation": "Engineer"
  },
  {
    "name": "Jane Smith",
    "age": "25",
    "city": "Los Angeles",
    "occupation": "Designer"
  }
]
```

With the `--compact` flag, the output will be:
```json
[{"name":"John Doe","age":"30","city":"New York","occupation":"Engineer"},{"name":"Jane Smith","age":"25","city":"Los Angeles","occupation":"Designer"}]
```

## Requirements

- Python 3.x

## Error Handling

The script handles the following errors:
- Missing input file
- Invalid CSV format
- Permission errors
- Encoding issues

## License

MIT