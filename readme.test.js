const fs = require("fs");
const axios = require("axios");

jest.mock("axios");
jest.mock("fs");

const { getGitHubStats, calculateUptime, generateREADME } = require("./readme");

describe("calculateUptime", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns correct age for a date well in the past", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-06-15T12:00:00Z"));

    const result = calculateUptime();

    expect(result.years).toBe(22);
    expect(result.months).toBe(9);
    expect(result.days).toBe(2);

    jest.useRealTimers();
  });

  it("returns 0 days when day-of-month matches", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-09-13T00:00:00Z"));

    const result = calculateUptime();

    expect(result.years).toBe(23);
    expect(result.months).toBe(0);
    expect(result.days).toBe(0);

    jest.useRealTimers();
  });

  it("handles day borrow when current day < birth day", () => {
    jest.useFakeTimers();
    // March 5, 2025: day (5) < birth day (13), so borrow from previous month
    jest.setSystemTime(new Date("2025-03-05T00:00:00Z"));

    const result = calculateUptime();

    // Feb 2025 has 28 days. days = 5 - 13 + 28 = 20, months = 3-9-1 = -7+12 = 5, years = 2025-2002-1 = 22
    expect(result.years).toBe(22);
    expect(result.months).toBe(5);
    expect(result.days).toBe(20);

    jest.useRealTimers();
  });

  it("handles month borrow when current month < birth month", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-15T00:00:00Z"));

    const result = calculateUptime();

    // months = 1 - 9 = -8 + 12 = 4, years = 2025 - 2002 - 1 = 22
    expect(result.years).toBe(22);
    expect(result.months).toBe(4);
    expect(result.days).toBe(2);

    jest.useRealTimers();
  });

  it("returns an object with years, months, and days keys", () => {
    const result = calculateUptime();
    expect(result).toHaveProperty("years");
    expect(result).toHaveProperty("months");
    expect(result).toHaveProperty("days");
  });

  it("returns non-negative values", () => {
    const result = calculateUptime();
    expect(result.years).toBeGreaterThanOrEqual(0);
    expect(result.months).toBeGreaterThanOrEqual(0);
    expect(result.days).toBeGreaterThanOrEqual(0);
  });
});

describe("getGitHubStats", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns followers, publicRepos, and stars from GitHub API", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/repos")) {
        return Promise.resolve({
          data: [
            { stargazers_count: 5 },
            { stargazers_count: 3 },
            { stargazers_count: 0 }
          ]
        });
      }
      return Promise.resolve({
        data: { followers: 65, public_repos: 7 }
      });
    });

    const result = await getGitHubStats();

    expect(result).toEqual({
      followers: 65,
      publicRepos: 7,
      stars: 8
    });
  });

  it("sends correct headers with requests", async () => {
    axios.get.mockResolvedValue({ data: { followers: 0, public_repos: 0 } });
    axios.get.mockImplementation((url) => {
      if (url.includes("/repos")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: { followers: 0, public_repos: 0 } });
    });

    await getGitHubStats();

    expect(axios.get).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "dynamic-readme-script"
        }
      })
    );
  });

  it("handles zero repos (empty array)", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/repos")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: { followers: 10, public_repos: 0 } });
    });

    const result = await getGitHubStats();

    expect(result).toEqual({ followers: 10, publicRepos: 0, stars: 0 });
  });

  it("sums stars across all repos", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/repos")) {
        return Promise.resolve({
          data: [
            { stargazers_count: 100 },
            { stargazers_count: 200 },
            { stargazers_count: 50 }
          ]
        });
      }
      return Promise.resolve({ data: { followers: 1, public_repos: 3 } });
    });

    const result = await getGitHubStats();

    expect(result.stars).toBe(350);
  });

  it("calls the correct GitHub API endpoints", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/repos")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: { followers: 0, public_repos: 0 } });
    });

    await getGitHubStats();

    expect(axios.get).toHaveBeenCalledWith(
      "https://api.github.com/users/siddhartha-pradhan",
      expect.any(Object)
    );
    expect(axios.get).toHaveBeenCalledWith(
      "https://api.github.com/users/siddhartha-pradhan/repos?per_page=100",
      expect.any(Object)
    );
  });

  it("propagates API errors", async () => {
    axios.get.mockRejectedValue(new Error("API rate limit exceeded"));

    await expect(getGitHubStats()).rejects.toThrow("API rate limit exceeded");
  });
});

describe("generateREADME", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("writes README.md with correct stats and uptime", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-06-15T12:00:00Z"));

    axios.get.mockImplementation((url) => {
      if (url.includes("/repos")) {
        return Promise.resolve({
          data: [{ stargazers_count: 1 }]
        });
      }
      return Promise.resolve({
        data: { followers: 65, public_repos: 7 }
      });
    });

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    await generateREADME();

    expect(fs.writeFileSync).toHaveBeenCalledTimes(1);
    expect(fs.writeFileSync).toHaveBeenCalledWith("README.md", expect.any(String));

    const writtenContent = fs.writeFileSync.mock.calls[0][1];
    expect(writtenContent).toContain("22 years, 9 months, 2 days old");
    expect(writtenContent).toContain("Public Repositories : 7");
    expect(writtenContent).toContain("Stars Collected     : 1");
    expect(writtenContent).toContain("Followers           : 65");

    consoleSpy.mockRestore();
    jest.useRealTimers();
  });

  it("includes the hero gif path", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/repos")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: { followers: 0, public_repos: 0 } });
    });

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    await generateREADME();

    const writtenContent = fs.writeFileSync.mock.calls[0][1];
    expect(writtenContent).toContain("assets/dota-faceless-void.gif");

    consoleSpy.mockRestore();
  });

  it("includes the generation comment", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/repos")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: { followers: 0, public_repos: 0 } });
    });

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    await generateREADME();

    const writtenContent = fs.writeFileSync.mock.calls[0][1];
    expect(writtenContent).toContain("README Generated via Readme.JS");

    consoleSpy.mockRestore();
  });

  it("logs a success message after writing", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/repos")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: { followers: 0, public_repos: 0 } });
    });

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    await generateREADME();

    expect(consoleSpy).toHaveBeenCalledWith(
      "README.md updated, congratulations, congratulations."
    );

    consoleSpy.mockRestore();
  });

  it("includes static content sections", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("/repos")) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: { followers: 0, public_repos: 0 } });
    });

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    await generateREADME();

    const writtenContent = fs.writeFileSync.mock.calls[0][1];
    expect(writtenContent).toContain("Technologia Stack");
    expect(writtenContent).toContain("Currently Cooking");
    expect(writtenContent).toContain("Core Philosophy");
    expect(writtenContent).toContain("Faceless Void");
    expect(writtenContent).toContain("Kathmandu, Nepal");

    consoleSpy.mockRestore();
  });
});
