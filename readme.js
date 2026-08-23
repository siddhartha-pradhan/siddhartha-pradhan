const fs = require("fs");
const { username, heroGifPath, birthDate } = require("./src/config");
const githubClient = require("./src/github-client");
const { calculateUptime } = require("./src/uptime");
const { buildReadme } = require("./src/template");

const getGitHubStats = async () => {
  const user = await githubClient.get(`/users/${username}`);
  const repos = await githubClient.get(`/users/${username}/repos?per_page=100`);

  let stars = 0;
  repos.data.forEach((repo) => {
    stars += repo.stargazers_count;
  });

  return {
    followers: user.data.followers,
    publicRepos: user.data.public_repos,
    stars,
  };
};

const generateREADME = async () => {
  const { followers, publicRepos, stars } = await getGitHubStats();
  const { years, months, days } = calculateUptime(birthDate);

  const readme = buildReadme({ publicRepos, stars, followers, years, months, days, heroGifPath });

  fs.writeFileSync("README.md", readme);
  console.log("README.md updated, congratulations, congratulations.");
};

generateREADME();
