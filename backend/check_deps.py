import pkg_resources

def check_conflicts(requirements_file):
    with open(requirements_file, 'r') as f:
        requirements = f.readlines()
    
    requirements = [req.strip() for req in requirements if req.strip() and not req.startswith('#')]
    
    try:
        pkg_resources.require(requirements)
        print("All dependencies are compatible")
    except pkg_resources.ContextualVersionConflict as e:
        print(f"Dependency conflict found: {e}")
    except Exception as e:
        print(f"Error checking dependencies: {e}")

if __name__ == "__main__":
    check_conflicts("requirements.txt")