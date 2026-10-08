# Anshkosh fox

Based on the two sprite sheets supplied by the user. The original Downloads files
were preserved. The built-in image editing tool removed the lower-right white
sparkle watermark and peach paper background, kept the fox's riso texture, scarf,
and medallion, and made a consistent forward-facing body for the head directions.

`directions-source.png` and `reactions-source.png` are the selected edited source
sheets. `directions.png` and `reactions.png` are packed into square cells with
transparent padding, preserving complete feet, tails, hearts, sparkles and Zs.

`scripts/build-fox-mascot.py` packs the uneven source gutters and runs the installed
[page-mascot workflow](https://github.com/nilbuild/page-mascot/tree/main/skills/page-mascot).
Run it from this repository with Python and Pillow, NumPy and SciPy installed.
The workflow is expected at `~/.codex/skills/page-mascot/scripts`.

The builder uses `--anchor shoulders --no-vignette`: these are complete animals,
so the bust-style bottom fade would erase their paws. The extra cross-sheet scale
correction is limited to 2% to avoid fitting the whole animal to paw shapes.
Atlases are served at
`public/mascots/anshkosh-fox-{directions,reactions}.webp`.

Validation: real alpha, nine frames per sheet, no source cell edge contact,
0.00px vertical shift at a 140px render, 66.0% palette match, 6.5% width difference.
The build checks the workflow's thresholds of 2px shift, 22% palette match and
12% width difference. Horizontal direction was also inspected visually.

The atlas check measures the feet and can miss a change in overall character
height. The centre direction is 225px tall, while reactions are 238–244px tall
(largest connected alpha silhouette, excluding floating decorations).
`AnshkoshMascot.module.css` displays reactions at 93% around the paw baseline
and shifts them up 1.7% of the tile. At the 240px error-page size, their visible
height is within 2.4px of the centre direction and their paws within 1.6px.
It also suppresses page-mascot's click squash/stretch so expressions change
without a second size change. Recheck these values if the atlases are rebuilt
or page-mascot changes its motion-wrapper/two-layer DOM structure.

## Image edit prompts

Directions (body alignment edit, before tail repair):

> Edit Image 1 directional sprite sheet to correct clipping and body consistency.
> Image 2 is the matching expressions sheet. SAME orange fox, navy scarf, gold
> medallion, cream muzzle, textured riso drawing. Exact 3x3 square grid, nine equal
> cells on real alpha transparent background. Shrink artwork enough to leave 12%
> empty margin on EVERY side of EVERY cell; no tails or hearts cross cell boundaries.
> IMPORTANT: reuse the exact FORWARD-FACING BODY from Image 2 in ALL NINE direction
> cells including its scarf, four paws and tail on the viewer's right. Only the HEAD
> turns; the body must be the same unchanged drawing, size and placement in all nine
> cells. No ground shadows. Row-major head poses looking up-left, up, up-right;
> left, front-center, right; down-left, down, down-right. The middle row left looks
> to viewer's left and right looks to viewer's right. Maintain neutral open eyes in
> down-facing head, no sleeping expression. Identical feet baseline in all cells.
> All head directions remain recognizable. No watermark or text. Preserve all
> artwork's colors and texture. Image 1 is edit target, Image 2 body and scale reference.

Directions (final tail repair, using the packed sheet):

> PRECISE OBJECT EDIT. This existing transparent 3x3 fox directions sprite sheet
> has a defect: all three foxes in the RIGHTMOST COLUMN are missing their tails.
> Repair ONLY that defect. Add the exact same fluffy orange tail with cream-and-navy
> tip from the center-column fox to each right-column fox, on the viewer's RIGHT
> side of the body, behind the body. Upper right, middle right, bottom right ALL
> must show a COMPLETE visible fluffy tail. The tails must fit within their own
> square cells and not be clipped. KEEP every existing head direction, body, paws,
> scarf, medallion, size, color, riso texture, position and cell alignment unchanged.
> Do not redraw any of the other six foxes. Maintain the identical 3x3 square cell
> layout and existing transparent margins. Keep alpha transparent. No background,
> ground shadow, text, symbols or watermark. Absolutely do not omit or hide the
> three restored tails.

Reactions (final selected edit):

> Use case: background-extraction / precise-object-edit. Image 1 is the EDIT TARGET:
> nine fox reactions. Image 2 is the cleaned directions sheet to MATCH. Remove image
> 1's peach paper background and remove the white four-point sparkle watermark at
> lower right beside the bottom-right fox's tail. Preserve all nine SAME orange chibi
> fox reactions, riso texture, navy scarf and gold medallion. Square overall sheet,
> exactly 3x3 equally sized square cells. Row-major blink, heart, sparkle; surprised,
> star-eyes, bashful; sleepy, dizzy, delighted. Keep reaction decorations
> heart/sparkles/Zs intact. MATCH image 2 center cell character scale, feet baseline
> and body exactly: all nine reactions must have that same forward-facing body
> including tail and scarf. Center head/body at each tile's center; feet aligned.
> Full character and all accessories fit inside each cell with a generous transparent
> margin on all four edges; no element or tail crosses a cell border. Alpha
> transparent background actual, no checkerboard, no text, no watermark. Preserve
> original artwork, no new style.
