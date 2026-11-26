# Automatic Tab Grouping

A lightweight Chrome extension that keeps your tab sidebar organized by automatically moving new tabs into existing tab groups based on their website domain.

## Overview

Modern browsers make it easy to create tab groups, but keeping those groups filled manually is repetitive. When you open a new YouTube, ChatGPT, Netflix, Google Docs, or Notion tab, you still have to drag it into the correct group.

This extension removes that manual step. When a tab is created or its URL changes, the extension checks the website host and moves the tab into an existing group with a matching title.

## Problem It Solves

- New tabs often open outside their proper group.
- Dragging tabs into groups is slow and distracting.
- Large tab collections become difficult to scan.
- Manual organization breaks down when you open many tabs per day.

The extension keeps the group structure you already created and places new tabs into it automatically.

## Main Features

- Groups tabs by website domain only.
- Uses your existing tab groups; it does not create new groups.
- Leaves unknown websites ungrouped.
- Uses exact group names to avoid accidental matches.
- Supports subdomains such as `www.youtube.com`, `web.whatsapp.com`, and `docs.google.com`.
- Requests only two Chrome permissions: `tabs` and `tabGroups`.
- Does not read page content, access bookmarks, access passwords, or send data anywhere.
- Includes a small test file for the domain classification rules.

## Supported Groups and Example Websites

| Group name | Example domains |
| --- | --- |
| `AI & ChatGPT` | `chatgpt.com`, `openai.com` |
| `YouTube & Videos` | `youtube.com`, `youtu.be`, `youtube-nocookie.com` |
| `Social Media & Messaging` | `whatsapp.com`, `x.com`, `twitter.com`, `t.co` |
| `Movies & Anime` | `netflix.com`, `moviztime.site` |
| `Learning & Books` | `terenglish.com`, `atirbooks.com` |
| `Research & University` | `notion.com`, `notion.so`, `overleaf.com` |
| `Google Tools` | `google.com`, `docs.google.com`, `drive.google.com`, `sheets.google.com`, `slides.google.com`, `meet.google.com`, `calendar.google.com`, `gmail.com`, `translate.google.com` |

Examples:

- `https://www.youtube.com/watch?v=...` goes to `YouTube & Videos`.
- `https://chatgpt.com/c/...` goes to `AI & ChatGPT`.
- `https://web.whatsapp.com/` goes to `Social Media & Messaging`.
- `https://docs.google.com/document/d/...` goes to `Google Tools`.
- `https://example.com/` stays ungrouped.

## How Automatic Grouping Works

1. Chrome starts the extension's background service worker.
2. The extension listens for two events:
   - a new tab is created;
   - a tab's URL changes.
3. The extension sends the URL to the classification function.
4. The classification function extracts the hostname, lowercases it, removes a leading `www.`, and compares it with the rule list.
5. If a rule matches, the extension asks Chrome for all existing tab groups.
6. It finds the first group whose title exactly matches the target group name.
7. It moves the tab into that group.
8. If no rule matches, or if the required group does not exist, nothing happens.

The extension never creates tab groups and never deletes tabs.

## Project Files

| File | Purpose |
| --- | --- |
| `manifest.json` | Chrome extension manifest. Declares Manifest V3, the extension name, permissions, and the background service worker. |
| `sw.js` | Background service worker. Listens for tab events and moves tabs into matching existing groups. |
| `classify.js` | Domain rulebook. Converts a URL into a group title, or returns `null` for unknown websites. |
| `classify.test.mjs` | Test file. Checks that group names and URL classifications are correct. |
| `package.json` | Marks the project as an ES module project so the test file can import `classify.js`. |

## Technologies Used

- JavaScript ES modules
- Chrome Extensions API
- Manifest V3
- `chrome.tabs` API
- `chrome.tabGroups` API
- Node.js built-in test runner for development tests

## Requirements

- Google Chrome with tab group support and Manifest V3 support.
- The seven required tab groups must already exist.
- Group names must match exactly, including capitalization, spaces, and `&`.
- At least one tab should remain in each group; if all tabs in a group are closed, Chrome removes that group.
- The extracted extension folder must stay on disk after installation.
- Developer mode must be enabled in `chrome://extensions` to load an unpacked extension.

No account, server, API key, build step, or third-party package is required to use the extension. Node.js is only needed if you want to run the tests.

---

# Installation Guide

## Step 1: Download the Project from GitHub

1. Open the repository page on GitHub.
2. Click the green **Code** button.
3. Click **Download ZIP**.
4. Save the ZIP file to a folder you can find easily.

Do not open the extension directly from the ZIP file. Chrome needs the extracted folder.

---

## Ubuntu Linux

### Step 2: Extract the ZIP File

Using the file manager:

1. Open your Downloads folder.
2. Right-click the downloaded ZIP file.
3. Select **Extract Here** or **Extract to...**
4. Open the extracted folder, usually named `chrome-tab-grouper-main`.
5. Keep this folder in place.

Using the terminal:

```bash
cd ~/Downloads
unzip chrome-tab-grouper-main.zip
```

If `unzip` is not installed:

```bash
sudo apt update
sudo apt install unzip
```

### Step 3: Create the Seven Required Tab Groups

The extension does not create groups. Create them first:

1. Open Google Chrome.
2. Open seven new tabs.
3. For each tab:
   1. Right-click the tab.
   2. Click **Add tab to new group**.
   3. Choose any color.
   4. Type the exact group name.
   5. Press **Enter**.
4. Keep at least one tab in every group.

Use these exact names:

```text
AI & ChatGPT
YouTube & Videos
Social Media & Messaging
Movies & Anime
Learning & Books
Research & University
Google Tools
```

### Step 4: Install the Extension in Chrome

1. In Chrome, open a new tab.
2. In the address bar, type:

   ```text
   chrome://extensions
   ```

3. Press **Enter**.
4. Turn on **Developer mode** using the toggle at the top right.
5. Click **Load unpacked** at the top left.
6. Select the extracted folder containing `manifest.json`.
7. Click **Open** or **Select Folder**.

A card named **Automatic Tab Grouping** should appear.

### Step 5: Enable and Test

1. On the `chrome://extensions` page, make sure the extension toggle is ON.
2. Open a new tab.
3. Visit:

   ```text
   https://www.youtube.com/
   ```

4. The tab should move automatically into `YouTube & Videos`.
5. Open another tab and visit:

   ```text
   https://example.com/
   ```

6. The `example.com` tab should stay ungrouped.

---

## Windows 10 / Windows 11

### Step 2: Extract the ZIP File

1. Open **File Explorer**.
2. Go to your Downloads folder.
3. Right-click the downloaded ZIP file.
4. Click **Extract All...**
5. Choose a destination folder, for example `Documents`.
6. Click **Extract**.
7. Open the extracted folder containing `manifest.json`.
8. Keep this folder in place.

### Step 3: Create the Seven Required Tab Groups

1. Open Google Chrome.
2. Open seven new tabs.
3. For each tab:
   1. Right-click the tab.
   2. Click **Add tab to new group**.
   3. Choose any color.
   4. Type the exact group name.
   5. Press **Enter**.
4. Keep at least one tab in every group.

Use these exact names:

```text
AI & ChatGPT
YouTube & Videos
Social Media & Messaging
Movies & Anime
Learning & Books
Research & University
Google Tools
```

### Step 4: Install the Extension in Chrome

1. In Chrome, open a new tab.
2. In the address bar, type:

   ```text
   chrome://extensions
   ```

3. Press **Enter**.
4. Turn on **Developer mode** using the toggle at the top right.
5. Click **Load unpacked** at the top left.
6. Select the extracted folder containing `manifest.json`.
7. Click **Select Folder**.

A card named **Automatic Tab Grouping** should appear.

### Step 5: Enable and Test

1. On the `chrome://extensions` page, make sure the extension toggle is ON.
2. Open a new tab.
3. Visit:

   ```text
   https://chatgpt.com/
   ```

4. The tab should move automatically into `AI & ChatGPT`.
5. Open another tab and visit:

   ```text
   https://example.com/
   ```

6. The `example.com` tab should stay ungrouped.

---

## Optional Development Test

If Node.js is installed, run the classification tests from the project folder:

```bash
node --test classify.test.mjs
```

This checks that the group names and supported domains are correct. Node.js is not required to use the extension in Chrome.

## Updating the Extension

If you replace the files in the extracted folder, return to `chrome://extensions` and click the circular **Reload** button on the extension card.

## Limitations

- The extension only supports domains listed in `classify.js`.
- It does not create missing tab groups.
- It does not remove a tab from its group if the tab later navigates to an unsupported website.
- If multiple groups have the same title, the first matching group is used.
- Unpacked extensions show a Developer mode warning in Chrome; this is normal.
- The folder must remain available; deleting or moving it can break the extension.
- Installing an unpacked extension is manual in current branded Chrome versions. Command-line loading and DevTools-loaded extensions are not persistent.

## Privacy

The extension has no server, analytics, content script, or host permissions. It only uses the Chrome tab and tab group APIs needed to move tabs into groups.
