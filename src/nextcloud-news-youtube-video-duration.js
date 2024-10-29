// ==UserScript==
// @name        Nextcloud News Youtube Video Duration
// @namespace   Violentmonkey Scripts
// @version     0.0.1
// @description Show the duration of YouTube videos and the channel name in the Nextcloud News apps compact view
// @author      skafau
// @match       https://nc.halumi.at/index.php/apps/news*
// @grant       GM_addStyle
// ==/UserScript==

const YT_API_KEY = 'AIzaSyBKZs3x0HsMbO7iWOcMMDAwejCCHHhZF1o';
const YT_VIDEO_LENGTH_DIV_CLASS = 'yt-video-length-div';

GM_addStyle(`
#app-content .utils ul {
  height: auto;
}

#app-content .utils .title h1 a {
  overflow-y: auto;
  white-space: normal;
}

#app-content .utils .title h1 a .intro {
  display: none;
}

.${YT_VIDEO_LENGTH_DIV_CLASS} {
  padding-top: 4px;
  padding-bottom: 12px;
  color: var(--color-placeholder-dark);
  font-size: 14px;
}
`);

const observer = new MutationObserver(async (mutations, ob) => {
  const titleLinkNodes = document.querySelectorAll('#app-content .utils .title h1 a');
  if (!titleLinkNodes.length) return;

  // Random magic number. W/o this, the script doesn't work...
  await sleep(500);

  for (let i = 0; i < titleLinkNodes.length; i++) {
    const titleLinkNode = titleLinkNodes[i];

    const h1NodeAlreadyHasLengthDiv = !!titleLinkNode.querySelector(`.${YT_VIDEO_LENGTH_DIV_CLASS}`);
    if (h1NodeAlreadyHasLengthDiv) return;

    const utilDiv = titleLinkNode.closest('div.utils');
    const links = utilDiv.querySelectorAll('a');
    const linkWithYouTubeLink = Array.from(links).find(link => link.href.includes('www.youtube.com'));
    const youTubeLink = linkWithYouTubeLink?.href;
    if (!youTubeLink) return;

    const { duration: durationIso8601, channelTitle } = await getYouTubeVideoInfo(youTubeLink);
    const durationInSeconds = parseIso8601DurationToSeconds(durationIso8601);
    const durationInMinutes = durationInSeconds / 60;
    const durationInMinutesFormatted = `${Math.round(durationInMinutes)} minutes`;

    const lengthDiv2 = titleLinkNode?.querySelector(`.${YT_VIDEO_LENGTH_DIV_CLASS}`);
    if (lengthDiv2) return;

    const newLengthDiv = document.createElement('div');
    newLengthDiv.className = YT_VIDEO_LENGTH_DIV_CLASS;
    newLengthDiv.textContent = `${durationInMinutesFormatted} - ${channelTitle}`;
    titleLinkNode.append(newLengthDiv);
  }
});
observer.observe(document.body, { childList: true, subtree: true });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getYouTUbeVideoIdFromUrl(url) {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^&\n]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function parseIso8601DurationToSeconds(duration) {
  const regex = /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const match = duration.match(regex);

  const years = match[1] ? parseInt(match[1], 10) : 0;
  const months = match[2] ? parseInt(match[2], 10) : 0;
  const days = match[3] ? parseInt(match[3], 10) : 0;
  const hours = match[4] ? parseInt(match[4], 10) : 0;
  const minutes = match[5] ? parseInt(match[5], 10) : 0;
  const seconds = match[6] ? parseInt(match[6], 10) : 0;

  const totalSeconds =
    years * 365 * 24 * 60 * 60 +
    months * 30 * 24 * 60 * 60 +
    days * 24 * 60 * 60 +
    hours * 60 * 60 +
    minutes * 60 +
    seconds;

  return totalSeconds;
}

async function getYouTubeVideoInfo(videoUrl) {
  const videoId = getYouTUbeVideoIdFromUrl(videoUrl);
  if (!videoId) throw new Error(`Invalid YouTube URL: ${videoUrl}`);

  const apiUrl = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${YT_API_KEY}&part=contentDetails,snippet`;

  const response = await fetch(apiUrl);
  const data = await response.json();
  if (data.items.length <= 0) throw new Error(`Video not found for URL ${videoUrl}`);

  const duration = data.items[0]?.contentDetails.duration;
  const channelTitle = data.items[0].snippet.channelTitle;
  return { duration, channelTitle };
}
