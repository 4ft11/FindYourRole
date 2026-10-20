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

For a live session, use the four-step guide at the top of **Battle Maps**. Keep **Player Preview** visible while setting up—it is the exact TV/Discord layout. **Test Player Display** sends a labeled radiant effect without spending a player use. Each real effect remains visible for about six seconds, includes the spell and outcome label, and can be replayed without spending another use. **Preview Effect · No Cost** tests an individual spell card before combat.

Ariel, Noah, Michael, and Chris now begin with editable starter action cards based only on the class information already confirmed in the site. Existing browser-saved maps with empty player lists receive those cards automatically. Because character levels and final sheets are not stored here, confirm the use counts and numerical rules against each finished sheet; the **Restore Player Starter Cards** button can replace a player’s edited list with the starter set.

Maps save in that browser. Use **Export Backup** before changing computers or clearing browser data, then use **Import Backup** on the other computer.

## Solenian Empire map

Open `/dm-ui` and choose **Empire Map**. Paint terrain, place and rename settlements, forts, ports, ruins, and regions, then draw roads or rivers between spaces. The editor uses invisible cells for easy painting, while the player-facing map renders as an illustrated parchment atlas with inked coastlines and no visible square grid. The atlas saves locally. **Download Player Map** creates a PNG for Discord or a television; **Export Editable Backup** preserves a JSON file that can be restored later.

No campaign data or DM drafts are sent to ChatGPT, and the website does not create ChatGPT share links.

## Private text-adventure rooms

The DM Studio now includes **Text Adventure**, a private narrative chat designed for one player at a time with optional support for several invited players. It is not connected to the battle map.

- The Guide writes narration, dialogue, system notices, warnings, and private messages.
- Players enter at `/adventure` using their exact invited name and the session's thread key.
- Players can reply privately to the Guide or speak to everyone in the thread.
- The Guide and players can attach images smaller than 1.5 MB.
- Optional dice rolls are generated by the server and recorded in the transcript.
- Typing indicators appear as in-world messages such as “THE GODS ARE THINKING...”

### Cheapest reliable Render setup

Cross-device messages need shared server storage. A free Render service can run the feature for testing, but its files are temporary and messages disappear whenever the service restarts or redeploys.

For persistent sessions:

1. Change the Render web service to the smallest paid compute plan.
2. Add a 1 GB persistent disk mounted at `/var/data`.
3. Add the environment variable `WAYFARER_DATA_DIR` with the value `/var/data/wayfarer`.
4. Add the secret environment variable `WAYFARER_DM_KEY` with a private passphrase only the DM knows.
5. Keep a single service instance. Render services with attached disks cannot scale to multiple instances.
6. Redeploy the website.

The Guide opens `/dm-ui`, selects **Text Adventure**, and unlocks it with `WAYFARER_DM_KEY`. On the local development preview only, the temporary key is `wayfarer-local`.

The disk stores the active session, transcript, rolls, and shared images. The room supports up to 12 invited names and retains the newest 300 messages. Use modest image sizes so the disk remains small.

## Campaign-day visual state

The public Index and DM surface now reveal a damaged celestial underlayer: a restrained night sky with fractured signal slips beneath the existing medieval interface. Reduced-motion mode disables the intermittent signal movement while preserving the star layer.
