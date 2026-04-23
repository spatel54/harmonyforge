import os
import glob

# Beautiful, consistent, minimalist SVG designs for each instrument category
# All SVGs use a 24x24 viewBox, have no background, and use a solid fill color (black or currentColor)

svg_templates = {
    "string": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%">
  <path fill="currentColor" d="M12 2C10 2 8.5 3.5 8.5 5C8.5 6.5 10 7.5 10 9C10 10.5 8 12 8 14C8 17.5 9.5 22 12 22C14.5 22 16 17.5 16 14C16 12 14 10.5 14 9C14 7.5 15.5 6.5 15.5 5C15.5 3.5 14 2 12 2ZM11.5 5H12.5V19H11.5V5ZM9 12C9 12 9.5 14 9.5 16H10V11C9.5 11 9 12 9 12ZM15 12C15 12 14.5 14 14.5 16H14V11C14.5 11 15 12 15 12Z"/>
</svg>''',
    
    "woodwind": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%">
  <path fill="currentColor" d="M11 2H13V20C13 21 14 22 14 22H10C10 22 11 21 11 20V2ZM12 4C11.5 4 11 4.5 11 5C11 5.5 11.5 6 12 6C12.5 6 13 5.5 13 5C13 4.5 12.5 4 12 4ZM12 8C11.5 8 11 8.5 11 9C11 9.5 11.5 10 12 10C12.5 10 13 9.5 13 9C13 8.5 12.5 8 12 8ZM12 12C11.5 12 11 12.5 11 13C11 13.5 11.5 14 12 14C12.5 14 13 13.5 13 13C13 12.5 12.5 12 12 12ZM12 16C11.5 16 11 16.5 11 17C11 17.5 11.5 18 12 18C12.5 18 13 17.5 13 17C13 16.5 12.5 16 12 16Z"/>
</svg>''',

    "brass": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%">
  <path fill="currentColor" d="M19 12C19 8 17 6 15 6H7C5.5 6 5 6.5 5 8C5 9.5 5.5 10 7 10H14C15 10 16 11 16 12C16 13 15 14 14 14H7C4 14 2 12 2 9C2 6 4 4 7 4H15C18 4 21 7 21 12C21 16 19 22 15 22H9V20H15C17 20 19 16 19 12ZM7 8H13V6H7C6.5 6 6 6.5 6 7C6 7.5 6.5 8 7 8Z"/>
</svg>''',

    "voice": '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%">
  <path fill="currentColor" d="M12 2C9.8 2 8 3.8 8 6V11C8 13.2 9.8 15 12 15C14.2 15 16 13.2 16 11V6C16 3.8 14.2 2 12 2ZM19 11C19 14.9 15.8 18 12 18C8.2 18 5 14.9 5 11H3C3 15.5 6.4 19.3 11 19.9V22H13V19.9C17.6 19.3 21 15.5 21 11H19Z"/>
</svg>'''
}

instruments_map = {
    "violin_i": "string",
    "viola": "string",
    "cello": "string",
    "double_bass": "string",
    "flute": "woodwind",
    "oboe": "woodwind",
    "clarinet": "woodwind",
    "bassoon": "woodwind",
    "french_horn": "brass",
    "trumpet": "brass",
    "trombone": "brass",
    "tuba": "brass",
    "soprano_voice": "voice",
    "alto_voice": "voice",
    "tenor_voice": "voice",
    "bass_voice": "voice"
}

def main():
    pngs = glob.glob("*.png")
    
    for instrument, category in instruments_map.items():
        svg_content = svg_templates[category]
        filename = f"{instrument}.svg"
        with open(filename, "w") as f:
            f.write(svg_content)
        print(f"Created {filename}")
        
    for png in pngs:
        try:
            os.remove(png)
            print(f"Removed {png}")
        except Exception as e:
            print(f"Failed to remove {png}: {e}")

if __name__ == "__main__":
    main()
