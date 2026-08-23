const fs = require("fs");
const axios = require("axios");

const username = "siddhartha-pradhan";
const heroGifPath = "assets/dota-faceless-void.gif";

const getGitHubStats = async () => {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "dynamic-readme-script"
  };

  const user = await axios.get(`https://api.github.com/users/${username}`, {
    headers,
    timeout: 10000
  });
  const repos = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100`, {
    headers,
    timeout: 10000
  });

  let stars = 0;
  repos.data.forEach((repo) => {
    stars += repo.stargazers_count;
  });

  return {
    followers: user.data.followers,
    publicRepos: user.data.public_repos,
    stars
  };
};

const calculateUptime = () => {
  const birthDate = new Date("2002-09-13T00:00:00Z");
  const now = new Date();

  let years = now.getUTCFullYear() - birthDate.getUTCFullYear();
  let months = now.getUTCMonth() - birthDate.getUTCMonth();
  let days = now.getUTCDate() - birthDate.getUTCDate();

  if (days < 0) {
    const prevMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 0);
    days += prevMonth.getUTCDate();
    months -= 1;
  }

  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return { years, months, days };
};

const generateREADME = async () => {
  const { followers, publicRepos, stars } = await getGitHubStats();
  const { years, months, days } = calculateUptime();

  const readme = `<!-- README Generated via Readme.JS. If you're reading this raw, congrats. You're early. -->


\`\`\`
(c).-.(c)            System.OS     : A black-box dev environment where code is crafted first, polished later. Built on silent documentation dives, dockerized dreams, and dark mode discipline.
( ⚆ _ ⚆ )            System.Uptime : ${years} years, ${months} months, ${days} days old.
 / (_) \\             Location      : Kathmandu, Nepal.
/_/   \\_\\            Status        : Grooving in Full Stack Flow™.

Technologia Stack
  • Languages         : C#, TypeScript, JavaScript.
  • Frameworks        : .NET, React, React Native, Blazor WASM.
  • Tools             : Docker, GitHub Actions, Hangfire, Firebase, Stripe, CI/CD Pipelines.
  • DB Love           : PostgreSQL, SQL Server, Redis.

GitHub Stats
  • Public Repositories : ${publicRepos}
  • Stars Collected     : ${stars}
  • Followers           : ${followers}
  • Lines of Code       : 3.1M++ (and counting...)

Currently Cooking
  • A fully dockerized dream that works on your machine too.
  • CI/CD pipelines that don’t randomly break at 2AM.
  • An API so clean it passes Lint with compliments.
  • C# and JS logic that doesn't bite on Fridays.
  • UIs I don’t want to gouge my eyes over (rarely).

Core Philosophy
  "Given proper time, a running laptop (preferably a Mac), and Claude, I can do anything."
\`\`\`

---

### Faceless Void

When I'm not freezing bugs in time, I'm probably freezing teamfights.

![Faceless Void – Chronosphere](${heroGifPath})

`;

  fs.writeFileSync("README.md", readme);
  console.log("README.md updated, congratulations, congratulations.");
};

generateREADME().catch((err) => {
  console.error("Failed to generate README:", err.message);
  process.exit(1);
});
