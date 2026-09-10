# Render deployment setup — manual upload mode

This version runs without a database. The uploaded website files are the shared source of truth, so every successful GitHub upload and Render redeploy updates the campaign information for all visitors.

## Important GitHub upload rule

Open the folder named `UPLOAD-THIS-FOLDER-FindYourRole`, select everything **inside** it, and drag those items into the GitHub uploader. The `app` folder and `package.json` must be visible on the repository's main page. Do not upload the enclosing folder as a single nested folder, or Render will report that it cannot find an `app` or `pages` directory.

## Render settings

1. Set the build command to:

   `pnpm install --frozen-lockfile && pnpm run build`

2. Set the start command to:

   `pnpm run start`

3. No environment variables are required for the public quiz.
4. Deploy the latest GitHub commit.

The public quiz and DM Creation Studio do not require a database or environment variables.

The public entrance now has two private name-triggered conversations for **Celis** and **Matt**. They do not need to choose a role and are not sent to the original archetype quiz. Celis speaks with Auren in a sunlit faerie field; Matt enters a private induction with the watcher of journeymen. Neither conversation uses the dungeon frame, quiz numbering, scoring, or a progress bar. Their replies remain local to their browser and can be copied for the game master.

## Updating shared campaign information

- Edit `data/campaign-seed.json` in the website files.
- Upload the changed files to GitHub.
- Render redeploys them, and every visitor receives the new shared version.
- Unfinished calibration answers, Matt's completed assessment, and remembered identity remain private to each player's browser.

The DM Creation Studio at `/dm-ui` is a browser-local creative tool for system windows, copy-and-paste messages, and item records. Its drafts stay on that device. It cannot edit the public website, change player records, or send messages automatically.

## Hybrid battle maps

1. Open `/dm-ui` and choose **Battle Maps**.
2. Upload a map image or use the blank grid, then add tokens and each player's spells or actions.
3. Select **Open Player View** twice using the same browser.
4. Put one Player View window on the television and share the other Player View window in Discord.
5. Keep the DM Creation Studio window private. Moving tokens, changing turns, measuring range, and triggering spell results update the Player Views on the same computer.

Spell cards use plain-language descriptions and roll instructions. Limited spells gray out after their final use. Short Rest and Long Rest controls restore the appropriate uses. Select an outcome such as hit, missed, saved, resisted, countered, or failed before choosing a target.

Ariel, Noah, Michael, and Chris now begin with editable starter action cards based only on the class information already confirmed in the site. Existing browser-saved maps with empty player lists receive those cards automatically. Because character levels and final sheets are not stored here, confirm the use counts and numerical rules against each finished sheet; the **Restore Player Starter Cards** button can replace a player’s edited list with the starter set.

Maps save in that browser. Use **Export Backup** before changing computers or clearing browser data, then use **Import Backup** on the other computer.

## Solenian Empire map

Open `/dm-ui` and choose **Empire Map**. Paint terrain, place and rename settlements, forts, ports, ruins, and regions, then draw roads or rivers between spaces. The editor uses invisible cells for easy painting, while the player-facing map renders as an illustrated parchment atlas with inked coastlines and no visible square grid. The atlas saves locally. **Download Player Map** creates a PNG for Discord or a television; **Export Editable Backup** preserves a JSON file that can be restored later.

No campaign data or DM drafts are sent to ChatGPT, and the website does not create ChatGPT share links.
