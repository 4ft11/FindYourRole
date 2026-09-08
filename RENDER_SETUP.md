# Render deployment setup — manual upload mode

This version runs without a database. The uploaded website files are the shared source of truth, so every successful GitHub upload and Render redeploy updates the campaign information for all visitors.

## Render settings

1. Set the build command to:

   `pnpm install --frozen-lockfile && pnpm run build`

2. Set the start command to:

   `pnpm run start`

3. No environment variables are required for the public quiz.
4. Deploy the latest GitHub commit.

The public quiz and DM Creation Studio do not require a database or environment variables.

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

Maps save in that browser. Use **Export Backup** before changing computers or clearing browser data, then use **Import Backup** on the other computer.

No campaign data or DM drafts are sent to ChatGPT, and the website does not create ChatGPT share links.
