import sys
import os
sys.path.append(os.getcwd())
try:
    from backend.services.parsers.cable_parser import extract_connectivity
except ImportError:
    sys.path.append(os.path.join(os.getcwd(), 'backend'))
    from services.parsers.cable_parser import extract_connectivity

full_desc_rh5 = """As a modern musician, a set of quality headphones will help you in so many scenarios. From solo practice on digital piano, electric guitar or electronic drums, to studying a mix, or just enjoying a playlist, Roland’s RH-5 headphones deliver in every setting. Priced within budget for working musicians, slip on this comfortable closed-back set and hear your music through high-performance 40mm drivers that keep all the tone and dynamics alive. Whatever you play, wherever your music takes you, you’ll want the RH-5 headphones in your gigbag.

When your music-making spans from DAW production to playing a range of electronic instruments, keep the RH-5 headphones at hand and you’ll always be ready to get creative. Competitively priced, this entry model in Roland’s acclaimed RH range is a great choice, equipped with 40mm drivers they deliver a dynamic-yet-balanced tone from digital pianos, guitars, synths, digital drums and more. Even when the session’s over, the RH-5 headphones are ideal for streaming music, complete with powerful bass and crystal clear highs.

With RH-5 headphones, you can block out distractions and lose yourself in the music. The closed-back design means you’ll never be interrupted by external noise or sound-bleed from other instruments, while the lightweight 190-gram construction prevents fatigue when you’re working late on a demanding mix or musical piece. With the addition of a tough 3-metre cord that lets you move easily between different instruments, computers and recording consoles, RH-5 headphones make recording and practice sessions more comfortable, focused and productive.

1/4-inch stereo female to 1/4-inch stereo male, 25 ft./7.5 m length.

1/8-inch stereo female to 1/8-inch stereo male, 25 ft./7.5 m length.

If you have questions about operating your Roland product, please check our Knowledge Base for answers to the most common questions.
You can also contact our Product Support through Roland Backstage.
In addition, we have a library of Owner’s Manuals and Support Documents that you can download and reference."""

print(extract_connectivity("RH-5", full_desc_rh5))
