import sys
import os
sys.path.append(os.getcwd())
from backend.services.parsers.cable_parser import extract_connectivity

desc = "1/4-inch stereo female to 1/4-inch stereo male, 25 ft./7.5 m length."
name = "RH-5"

print(f"Testing Name: {name}")
print(f"Testing Desc: {desc}")
result = extract_connectivity(name, desc)
print(f"Result: {result}")

desc2 = "Roland RIC-G3 Gold Series Instrument Cable"
name2 = "RIC-G3"
print(f"Testing Name: {name2}")
print(f"Testing Desc: {desc2}")
result2 = extract_connectivity(name2, desc2)
print(f"Result: {result2}")
