import csv
import json
import sys
import os
from typing import List, Dict, Any

def csv_to_json(csv_file_path: str, json_file_path: str, pretty_print: bool = True) -> bool:
    """
    Convert CSV file to JSON format
    
    Args:
        csv_file_path (str): Path to the input CSV file
        json_file_path (str): Path to the output JSON file
        pretty_print (bool): Whether to format JSON with indentation
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Check if CSV file exists
        if not os.path.exists(csv_file_path):
            raise FileNotFoundError(f"CSV file '{csv_file_path}' not found.")
        
        # Read CSV and convert to JSON
        data = []
        with open(csv_file_path, 'r', encoding='utf-8') as csv_file:
            csv_reader = csv.DictReader(csv_file)
            for row in csv_reader:
                data.append(row)
        
        # Write JSON file
        with open(json_file_path, 'w', encoding='utf-8') as json_file:
            if pretty_print:
                json.dump(data, json_file, indent=2, ensure_ascii=False)
            else:
                json.dump(data, json_file, separators=(',', ':'), ensure_ascii=False)
        
        print(f"Successfully converted '{csv_file_path}' to '{json_file_path}'")
        return True
        
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return False
    except csv.Error as e:
        print(f"Error reading CSV file: {e}")
        return False
    except Exception as e:
        print(f"Error converting CSV to JSON: {e}")
        return False

def main():
    # Check command line arguments
    if len(sys.argv) < 3:
        print("Usage: python csv_to_json.py <input.csv> <output.json> [--compact]")
        print("Example: python csv_to_json.py data.csv data.json")
        print("Example (compact format): python csv_to_json.py data.csv data.json --compact")
        return False
    
    input_csv = sys.argv[1]
    output_json = sys.argv[2]
    compact = '--compact' in sys.argv
    
    return csv_to_json(input_csv, output_json, not compact)

if __name__ == "__main__":
    main()