# OWASP Certificate Graphic Design Specification

## Canvas Dimensions

| Property         | Value                    |
| ---------------- | ------------------------ |
| Canvas Width     | 2480 pixels              |
| Canvas Height    | 3508 pixels (A4 ratio)   |
| Background Color | #171c24 (dark navy blue) |

---

## Color System

### Tier-Based Animated Gradients

#### Bronze Tier

| Position   | Color   |
| ---------- | ------- |
| Start (0%) | #ff0044 |
| End (100%) | #ff3396 |

#### Silver Tier

| Position   | Color   |
| ---------- | ------- |
| Start (0%) | #3fbbfe |
| End (100%) | #4157ff |

#### Gold Tier

| Position   | Color   |
| ---------- | ------- |
| Start (0%) | #ff46f0 |
| End (100%) | #711bff |

### Gradient Movement

- Direction: Diagonal from bottom-right to top-left
- Angle Range: 135° to 315°
- Speed: 0.02 units per frame

### Text Colors

| Element        | Color           |
| -------------- | --------------- |
| All Text       | White (#ffffff) |
| Certificate ID | Gradient        |

---

## Typography

### Fonts Used

| Font          | Usage                               |
| ------------- | ----------------------------------- |
| Cascadia Mono | Main title "CERTIFICATE"            |
| Cascadia Code | Subtitle and "PRESENTED TO"         |
| Impact        | Recipient name                      |
| Corbel        | Body text, repository count, titles |
| Ebrima        | Certificate ID, signatory names     |

### Complete Font Specifications

| Element                    | Font          | Size  | Weight      | Style  |
| -------------------------- | ------------- | ----- | ----------- | ------ |
| "CERTIFICATE" Title        | Cascadia Mono | 200px | Bold        | Normal |
| "OF CONTRIBUTION" Subtitle | Cascadia Code | 100px | Light (200) | Normal |
| "PRESENTED TO"             | Cascadia Code | 100px | Light (200) | Normal |
| Recipient Name             | Impact        | 260px | Normal      | Normal |
| Repository Count           | Corbel        | 70px  | Normal      | Italic |
| Certificate ID             | Ebrima        | 70px  | Normal      | Normal |
| "VERIFIED CONTRIBUTOR"     | Ebrima        | 70px  | Normal      | Normal |
| Signatory Names            | Ebrima        | 90px  | Bold        | Normal |
| Signatory Titles           | Corbel        | 50px  | Normal      | Normal |
| Body Text                  | Corbel        | 90px  | Light (200) | Normal |

---

## Layout and Positioning

### Main Elements

| Element                    | X Position | Y Position | Width      |
| -------------------------- | ---------- | ---------- | ---------- |
| OWASP Logo                 | 330        | 415        | 483px      |
| "CERTIFICATE" Title        | 330        | 800        | -          |
| "OF CONTRIBUTION" Subtitle | 550        | 900        | -          |
| "PRESENTED TO"             | 640        | 1400       | -          |
| Recipient Name             | 190        | 1680       | -          |
| Certificate ID Badge       | 460        | 1000       | 1070px     |
| "VERIFIED CONTRIBUTOR"     | 190        | 1250       | -          |
| Body Text                  | 190        | 1800       | Max 2000px |
| Repository Count           | 190        | 2450       | -          |
| Left Signature             | 300        | 2460       | 440×290px  |
| Left Signatory Name        | 190        | 2850       | -          |
| Right Signatory Name       | 1510       | 2850       | -          |
| Left Signatory Title       | 190        | 2930       | -          |
| Right Signatory Title      | 1510       | 2930       | -          |
| QR Code                    | 190        | 3000       | 250×250px  |

### Vertical Zones (Y-Axis)

| Range        | Content                |
| ------------ | ---------------------- |
| 0 to 400     | Empty space            |
| 415 to 560   | Logo                   |
| 800 to 900   | Main title             |
| 1000 to 1120 | Certificate ID badge   |
| 1250 to 1320 | "VERIFIED CONTRIBUTOR" |
| 1400 to 1480 | "PRESENTED TO"         |
| 1680 to 1940 | Recipient name         |
| 1800 to 2300 | Body text (multi-line) |
| 2450 to 2520 | Repository count       |
| 2460 to 2750 | Signatures             |
| 2850 to 2940 | Signatory names        |
| 2930 to 2980 | Signatory titles       |
| 3000 to 3250 | QR Code                |

---

## Graphic Elements

### Images and SVGs

| Element        | File           | Dimensions  | Position    | Opacity |
| -------------- | -------------- | ----------- | ----------- | ------- |
| Logo           | owasp-logo.svg | 483×145px   | (330, 415)  | 100%    |
| Signature      | signature.svg  | 440×290px   | (300, 2460) | 100%    |
| Bronze Pattern | stage-1.svg    | Full canvas | (0, 0)      | 20%     |
| Silver Pattern | stage-2.svg    | Full canvas | (0, 0)      | 20%     |
| Gold Pattern   | stage-3.svg    | Full canvas | (0, 0)      | 20%     |

---

## QR Code Specifications

| Property         | Value          |
| ---------------- | -------------- |
| Position         | (190, 3000)    |
| Size             | 250×250 pixels |
| Dot Color        | Gradient       |
| Background Color | Transparent    |
| Dot Style        | Rounded        |

---

## Visual Effects

- Gradient Animation: Diagonal movement from bottom-right to top-left

---

## Design Notes

1. Negative Space: 0 to 400 pixels at the top provides visual breathing room

2. Visual Hierarchy:
   
   - Main title (200px) - largest element
   - Recipient name (260px) - most prominent element
   - Secondary text (70 to 100px)
   - Details (50 to 70px)

3. Symmetry: Signatories are symmetrically arranged on both sides of the page

4. Alignment: All text is left-aligned
