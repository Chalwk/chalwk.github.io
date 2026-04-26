---
title: "Comprehensive Markdown Tutorial"
date: 2026-04-07
last-updated: 2026-04-07
categories: [ tutorial, documentation, web ]
tags: [ markdown, syntax, advanced, formatting ]
---

# Comprehensive Markdown Tutorial

Markdown is a lightweight markup language that's easy to read and write. It's widely used for formatting plain text,
such as documentation, README files, and even blog posts. This tutorial covers everything from basic syntax to advanced
extensions, with plenty of examples.

---

## Headings

Use `#` symbols to create headings. The number of `#` determines the heading level (1-6). Headings create a document
outline and can be linked to using auto-generated IDs or custom ones.

```markdown
# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6
```

**Result:**

# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

**Custom Heading IDs** (some parsers):

```markdown
### My Heading {#custom-id}
```

Then link to it: `[link](#custom-id)`

---

## Paragraphs and Line Breaks

Write plain text to create paragraphs. Leave a **blank line** between paragraphs to separate them.

```markdown
This is the first paragraph.

This is the second paragraph.
```

**Result:**

This is the first paragraph.

This is the second paragraph.

**Line breaks (soft vs. hard)**:

- To create a line break without a new paragraph, end a line with **two spaces** then a newline.
- Or use an empty line to create a new paragraph.

```markdown
First line with two spaces after  
Second line (same paragraph, but line break)

New paragraph.
```

**Result:**

First line with two spaces after  
Second line (same paragraph, but line break)

New paragraph.

---

## Emphasis (Italic, Bold, etc.)

### Italic

Wrap text in single asterisks (`*`) or underscores (`_`).

```markdown
*Italic* or _Italic_
```

**Result:** *Italic* or _Italic_

### Bold

Wrap text in double asterisks (`**`) or double underscores (`__`).

```markdown
**Bold** or __Bold__
```

**Result:** **Bold** or __Bold__

### Bold and Italic

Combine three asterisks (`***`) or three underscores (`___`). The order of opening/closing must match.

```markdown
***Bold and italic*** or ___Bold and italic___
```

**Result:** ***Bold and italic*** or ___Bold and italic___

### Nested Emphasis

You can nest italics inside bold, etc.

```markdown
**Bold with *italic* inside**
*Italic with **bold** inside*
```

**Result:** **Bold with *italic* inside**  
*Italic with **bold** inside*

### Strikethrough

Use double tildes (`~~`). (More details in [Strikethrough](#strikethrough) section.)

```markdown
~~This text is struck through.~~
```

**Result:** ~~This text is struck through.~~

---

## Lists

### Unordered Lists

Use `-`, `*`, or `+` followed by a space. Indent sub-items with 2 or 4 spaces.

```markdown
- Item 1
- Item 2
    - Subitem 2.1
        - Deeper subitem
- Item 3
```

**Result:**

- Item 1
- Item 2
    - Subitem 2.1
        - Deeper subitem
- Item 3

### Ordered Lists

Use numbers followed by a period (`.`). The actual numbers you type don't matter - Markdown will renumber them
sequentially.

```markdown
1. First
2. Second
    1. Subitem A
    2. Subitem B
3. Third
```

**Result:**

1. First
2. Second
    1. Subitem A
    2. Subitem B
3. Third

### Mixed Lists

You can mix ordered and unordered lists.

```markdown
1. Topic A
    - Subtopic A1
    - Subtopic A2
2. Topic B
    1. Subtopic B1
    2. Subtopic B2
```

**Result:**

1. Topic A
    - Subtopic A1
    - Subtopic A2
2. Topic B
    1. Subtopic B1
    2. Subtopic B2

### List with Paragraphs

To add a paragraph inside a list item, indent the paragraph to the same level as the text.

```markdown
- First item with a paragraph.

  This paragraph is still inside the first item.  
  Line break inside the same paragraph.
- Second item.
```

**Result:**

- First item with a paragraph.

  This paragraph is still inside the first item.  
  Line break inside the same paragraph.
- Second item.

---

## Links

### Inline Links

```markdown
[Chalwk's Site](https://chalwk.github.io/)
```

**Result:** [Chalwk's Site](https://chalwk.github.io/)

### Relative Links (to local files)

```markdown
[README](../README.md)
[/assets/images/avatar.png](/assets/images/avatar.png)
```

### Internal Links (to headings)

Use `#` followed by the heading text (lowercase, spaces replaced with hyphens).

```markdown
[Go to Emphasis Section](#emphasis-italic-bold-etc)
```

**Result:** [Go to Emphasis Section](#emphasis-italic-bold-etc)

### Link with Title (Tooltip)

Add a title inside quotes after the URL.

```markdown
[Chalwk's Site](https://chalwk.github.io/ "Chalwk's homepage")
```

**Result:** [Chalwk's Site](https://chalwk.github.io/ "Chalwk's homepage") (hover to see the tooltip)

### Link References

Reference-style links make text cleaner. Define the reference anywhere (often at the bottom).

```markdown
Here's [a reference link][1] and [another one][Chalwk].

[1]: https://example.com "Example"

[Chalwk]: https://chalwk.github.io/
```

**Result:** Here's [a reference link][1] and [another one][Chalwk].

[1]: https://example.com "Example"

[Chalwk]: https://chalwk.github.io/

### Automatic Links

Wrap a URL or email in angle brackets to turn it into a link.

```markdown
<https://www.example.com>
<name@example.com>
```

**Result:** <https://www.example.com>  
<name@example.com>

---

## Images

### Basic Image

```markdown
![Alt text](https://github.com/Chalwk/chalwk.github.io/blob/main/assets/images/avatar.png)
```

**Result:** ![Alt text](/assets/images/avatar.png)

### Image with Title (Tooltip)

```markdown
![Chalwk Logo](/assets/images/avatar.png "Chalwk logo")
```

### Resizing Images (HTML)

Markdown itself doesn't support resizing, but you can use HTML.

```html
<img src="/assets/images/avatar.png" alt="Chalwk Logo" width="200">
```

**Result:**  
<img src="/assets/images/avatar.png" alt="Chalwk Logo" width="200">

### Image Links

Wrap an image in a link to make it clickable.

```markdown
[![Chalwk Logo](/assets/images/avatar.png)](https://chalwk.github.io/)
```

**Result:** (Click the image)  
[![Chalwk Logo](/assets/images/avatar.png)](https://chalwk.github.io/)

---

## Blockquotes

Use `>` followed by a space to create blockquotes.

```markdown
> This is a blockquote.
> It spans multiple lines.
```

**Result:**

> This is a blockquote.
> It spans multiple lines.

### Nested Blockquotes

Add additional `>` levels.

```markdown
> Level 1
>> Level 2
>>> Level 3
```

**Result:**

> Level 1
>> Level 2
>>> Level 3

### Blockquotes with Other Elements

Blockquotes can contain headings, lists, code blocks, etc.

```markdown
> ## A heading inside a quote
>
> - List item 1
> - List item 2

```

**Result:**

> ## A heading inside a quote
>
> - List item 1
> - List item 2

### Citations

Markdown does not have a native citation system, but you can create **clickable citations** using reference-style links.
This works in Jekyll, GitHub, and most Markdown processors.

#### External Link

Place a citation number in brackets `[1]` and define the URL at the bottom of your document. The number becomes a live
link.

```markdown
According to the official Markdown guide, the syntax was designed for readability [1].

[1]: https://www.markdownguide.org/getting-started/ "Markdown Guide: Getting Started"
```

**Result:**

According to the official Markdown guide, the syntax was designed for readability [1].

[1]: https://www.markdownguide.org/getting-started/ "Markdown Guide: Getting Started"

#### Internal Link (to another section of this tutorial)

You can also link a citation to a heading or a specific part of your document.

```markdown
For syntax highlighting examples, see the Code section [2].

[2]: #code
```

**Result:**

For syntax highlighting examples, see the Code section [2].

[2]: #code

> **Note:** This method creates a simple numbered link. If you need footnotes that jump back and forth (like academic
> papers), use standard footnote syntax `[^1]` instead.

---

## Code

### Inline Code

Wrap text in backticks (`` ` ``).

```markdown
Use the `printf` function in C.
```

**Result:** Use the `printf` function in C.

### Code Blocks (Fenced)

Use triple backticks (```` ``` ````) or indent by 4 spaces. Specify a language for syntax highlighting.

````markdown
```python
def say_hello(name):
    return f"Hey there, {name}!"
```
````

**Result:**

```python
def say_hello(name):
    return f"Hey there, {name}!"
```

### Diff / Line Highlighting (Some parsers)

Some Markdown renderers (like GitHub) support highlighting lines with `{ln=...}` or `hl_lines`.

````markdown
```python hl_lines="2 4"
def hello():
    print("Hello")  # highlighted
    return True

    # this line also highlighted
```
````

### Diff Code Blocks

Use `diff` as the language to show additions and deletions.

````markdown
```diff
- def old_function():
+ def new_function():
    return "updated"
```
````

**Result:**

```diff
- def old_function():
+ def new_function():
    return "updated"
```

---

## Tables

Use `|` to create tables. Separate headers from rows with `---`.

```markdown
| Name     | Age | Occupation  |
|----------|-----|-------------|
| Alice    | 30  | Developer   |
| Bob      | 25  | Designer    |
```

**Result:**

| Name  | Age | Occupation |
|-------|-----|------------|
| Alice | 30  | Developer  |
| Bob   | 25  | Designer   |

### Text Alignment

Add colons (`:`) in the separator row:

- `:---` = left-aligned (default)
- `:---:` = center-aligned
- `---:` = right-aligned

```markdown
| Left | Center | Right |
|:-----|:------:|------:|
| 1    | 2      | 3     |
| 4    | 5      | 6     |
```

**Result:**

| Left | Center | Right |
|:-----|:------:|------:|
| 1    |   2    |     3 |
| 4    |   5    |     6 |

### Column Spanning (HTML)

Markdown tables don't support colspan/rowspan directly, but you can embed HTML.

```html

<table>
    <tr>
        <th>Name</th>
        <th>Age</th>
    </tr>
    <tr>
        <td colspan="2">Alice is 30</td>
    </tr>
</table>
```

**Result:**

<table>
  <tr><th>Name</th><th>Age</th></tr>
  <tr><td colspan="2">Alice is 30</td></tr>
</table>

---

## Horizontal Rules

Use three or more `---`, `***`, or `___` on a blank line.

```markdown
---

***
___
```

**Result:**

---

***

___

*Note:* Avoid using `---` inside headings or list items without proper spacing, as it might be misinterpreted.

---

## Escaping Characters

Use a backslash (`\`) to escape Markdown syntax and display literal characters.

```markdown
\*This is not italic\*  
\# Not a heading  
1\. Not a numbered list item
```

**Result:**  
\*This is not italic\*  
\# Not a heading  
1\. Not a numbered list item

**Escape these characters:** `\` ` ` ` ` `*` `_` `{}` `[]` `()` `#` `+` `-` `.` `!` `|` `<` `>` `~`

---

## Basic Advanced Features

### Task Lists

Use `- [ ]` for an unchecked box and `- [x]` for a checked box. Nested tasks are possible.

```markdown
- [x] Task 1 (done)
- [ ] Task 2
    - [x] Sub-task 2.1
    - [ ] Sub-task 2.2
- [ ] Task 3
```

**Result:**

- [x] Task 1 (done)
- [ ] Task 2
    - [x] Sub-task 2.1
    - [ ] Sub-task 2.2
- [ ] Task 3

### Footnotes

Footnotes allow you to add references without interrupting the flow. Use `[^1]` for the marker and `[^1]: text` for the
definition.

```markdown
This sentence has a footnote.[^1] And another one.[^2]

[^1]: First footnote content.
[^2]: Second footnote with **markdown** inside.
```

**Result:**  
This sentence has a footnote.[^1] And another one.[^2]

[^1]: First footnote content.
[^2]: Second footnote with **markdown** inside.

### Strikethrough

Double tilde `~~` for strikethrough text.

```markdown
~~This is no longer relevant.~~
```

**Result:** ~~This is no longer relevant.~~

### Definition Lists

Some parsers (e.g., Kramdown, MkDocs) support definition lists.

```markdown
Term 1
: Definition for Term 1

Term 2
: First definition
: Second definition
```

**Result:**
Term 1
: Definition for Term 1

Term 2
: First definition
: Second definition

### Admonitions (Callouts)

Common in MkDocs Material and some other parsers. Use `!!!` followed by a type and optional title.

```markdown
!!! note
This is a note with default styling.

!!! warning "Custom Title"
A warning box with a custom title.

!!! success
Success message.
```

**Result (if supported by parser):**

!!! note
This is a note with default styling.

!!! warning "Custom Title"
A warning box with a custom title.

!!! success
Success message.

---

## More Advanced Features

### HTML and Inline HTML

Markdown allows raw HTML. This is powerful for things not covered by Markdown.

```html

<div style="background: #f0f0f0; padding: 1em;">
    This is a <span style="color: red;">red</span> word inside a div.
</div>
```

**Result:**
<div style="background: #f0f0f0; padding: 1em;">
  This is a <span style="color: red;">red</span> word inside a div.
</div>

*Note:* In some environments (like GitHub), raw HTML may be sanitized.

### Math Expressions (LaTeX)

Many Markdown processors (e.g., Jupyter, GitLab, with extensions) support LaTeX math inside `$...$` (inline) or
`$$...$$` (display).

```markdown
Inline math: $E = mc^2$

Display math:
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

**Result (if math renderer enabled):**  
Inline math: $E = mc^2$

Display math:
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

### Emojis

Some parsers support emoji shortcodes (like GitHub). You can also paste Unicode emojis.

```markdown
:smile: :heart: :rocket:
😃 🚀
```

**Result (GitHub-style):** :smile: :heart: :rocket:  
😃 🚀

### Comments

Markdown does not have native comments, but you can use HTML comments.

```html
<!-- This is a comment and will not be displayed -->
Visible text.
```

**Result:**  
Visible text.

### Abbreviations

Some parsers (e.g., Kramdown) support abbreviation definitions.

```markdown
The HTML specification is maintained by the WHATWG.

*[HTML]: Hyper Text Markup Language
*[WHATWG]: Web Hypertext Application Technology Working Group
```

**Result (hover over HTML or WHATWG):**  
The HTML specification is maintained by the WHATWG.

### Collapsible Sections (Details)

Using HTML `<details>` and `<summary>` tags (works on GitHub).

```html

<details>
    <summary>Click to expand</summary>
    Hidden content can include **markdown** or code.
</details>
```

**Result:**

<details>
<summary>Click to expand</summary>
Hidden content can include **markdown** or code.
</details>

### Subscripts and Superscripts

Not standard, but you can use HTML or some extensions (`^` for sup, `~` for sub).

```html
H<sub>2</sub>O and E = mc<sup>2</sup>
```

**Result:** H<sub>2</sub>O and E = mc<sup>2</sup>

With extensions (e.g., Pandoc, Markdown Extra):

```markdown
H~2~O and E = mc^2^
```

### Link References (Advanced)

You can group all link references at the end of your document for cleaner source.

```markdown
I often visit [Google] and [GitHub].

[Google]: https://www.google.com

[GitHub]: https://github.com
```

**Result:** I often visit [Google] and [GitHub].

### Highlighting

Some parsers support `==highlight==` for marking text.

```markdown
This is ==very important==.
```

**Result (if supported):** This is ==very important==.

---