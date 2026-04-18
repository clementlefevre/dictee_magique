#!/usr/bin/env python
# coding: utf-8
"""
Text-to-Speech generation using Piper TTS (open-source, offline).
Replaces the Google Cloud TTS dependency.

Usage:
  python python/create_sounds_piper.py --list ASK_PLAYER_NAME GREETINGS_1
  python python/create_sounds_piper.py --questions
  python python/create_sounds_piper.py --prenoms
  python python/create_sounds_piper.py --full

Requirements:
  pip install piper-tts

The Piper model will be auto-downloaded on first run.
French voice: fr_FR-siwis-medium
"""

import os
import subprocess
import string
import json
import argparse
import time
import wave
import shutil
from pathlib import Path

ASSETS_FOLDER = "./app/src/assets/"
PIPER_VOICE = "fr_FR-siwis-medium"

# Load text content
text_content = None
with open(ASSETS_FOLDER + "text/text_content.json") as json_file:
    text_content = json.load(json_file)

parser = argparse.ArgumentParser(description="Generate TTS audio using Piper (open-source)")
parser.add_argument("--questions", action="store_true", help="Generate question sounds")
parser.add_argument("--prenoms", action="store_true", help="Generate first name sounds")
parser.add_argument("--list", nargs="+", help="Generate sounds for specific sections")
parser.add_argument("--full", action="store_true", help="Generate all sounds")
parser.add_argument("--voice", default=PIPER_VOICE, help=f"Piper voice model (default: {PIPER_VOICE})")
parser.add_argument("--output-dir", default=ASSETS_FOLDER, help="Output base directory")
args = parser.parse_args()


def ensure_piper():
    """Check that piper is available."""
    result = subprocess.run(["piper", "--help"], capture_output=True)
    if result.returncode != 0:
        print("Piper TTS not found. Install with: pip install piper-tts")
        print("Then run this script again.")
        raise SystemExit(1)


def wav_to_mp3(wav_path, mp3_path):
    """Convert WAV to MP3 using ffmpeg."""
    subprocess.run(
        ["ffmpeg", "-y", "-i", wav_path, "-codec:a", "libmp3lame", "-qscale:a", "2", mp3_path],
        capture_output=True,
        check=True,
    )
    os.remove(wav_path)


def store_text(text_to_store, filename=None, folder=None, voice=PIPER_VOICE, output_dir=ASSETS_FOLDER):
    """Generate TTS audio for a text string and save as MP3."""
    print(f"Generating: '{text_to_store}' -> {folder}/{filename}")

    folderpath = os.path.join(output_dir, "sounds", folder)
    os.makedirs(folderpath, exist_ok=True)

    if filename is None:
        filename = str(text_to_store)

    wav_path = os.path.join(folderpath, filename + ".wav")
    mp3_path = os.path.join(folderpath, filename + ".mp3")

    # Use piper to generate WAV
    process = subprocess.run(
        ["piper", "--model", voice, "--output_file", wav_path],
        input=text_to_store.encode("utf-8"),
        capture_output=True,
    )

    if process.returncode != 0:
        print(f"  Error generating audio: {process.stderr.decode()}")
        return False

    # Convert to MP3
    try:
        wav_to_mp3(wav_path, mp3_path)
        print(f"  -> {mp3_path}")
        return True
    except Exception as e:
        print(f"  Error converting to MP3: {e}")
        # Keep WAV if MP3 conversion fails
        if os.path.exists(wav_path):
            print(f"  WAV file kept: {wav_path}")
        return False


def create_alphabet(voice=PIPER_VOICE):
    """Generate alphabet letter sounds."""
    for letter in string.ascii_lowercase:
        store_text(letter, folder="ALPHABET", voice=voice)


def create_numbers(voice=PIPER_VOICE):
    """Generate number sounds."""
    for i in range(100):
        store_text(str(i + 1), folder="NUMBER", voice=voice)


def create_prenoms(voice=PIPER_VOICE):
    """Generate first name sounds (skip existing)."""
    p = Path(os.path.join(ASSETS_FOLDER, "sounds", "PRENOMS")).glob("**/*")
    existing = [x.stem for x in p if x.is_file()]

    with open(ASSETS_FOLDER + "text/prenoms.json") as json_file:
        prenoms = json.load(json_file)

    for k, v in prenoms.items():
        if k not in existing:
            try:
                store_text(v, k, "PRENOMS", voice=voice)
                time.sleep(0.5)
            except Exception as e:
                print(f"Could not generate audio for {v}: {e}")


def create_specific_sections(section_list, content=None, voice=PIPER_VOICE):
    """Generate sounds for specific sections."""
    if content is None:
        content = text_content

    for section in section_list:
        if section not in content:
            print(f"Section '{section}' not found in text_content.json")
            continue
        for k, v in content[section].items():
            store_text(v, k, section, voice=voice)
            time.sleep(0.3)


def create_all_sounds(voice=PIPER_VOICE):
    """Generate all sounds."""
    for section in text_content:
        if section != "SOUNDS":
            for k, v in text_content[section].items():
                store_text(v, k, section, voice=voice)
                time.sleep(0.3)


if __name__ == "__main__":
    ensure_piper()

    voice = args.voice

    if args.list:
        create_specific_sections(args.list, voice=voice)

    if args.questions:
        question_sections = [s for s in text_content if s.startswith("QUESTIONS_LEVEL_")]
        create_specific_sections(question_sections, voice=voice)

    if args.prenoms:
        create_prenoms(voice=voice)

    if args.full:
        create_alphabet(voice=voice)
        create_numbers(voice=voice)
        create_all_sounds(voice=voice)

    if not any([args.list, args.questions, args.prenoms, args.full]):
        parser.print_help()
