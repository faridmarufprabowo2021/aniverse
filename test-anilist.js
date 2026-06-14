const fetch = require('node-fetch');

const run = async () => {
  const q = `query GetStudioAnime($id: Int!, $page: Int!, $perPage: Int!) {
    Studio(id: $id) {
      id
      name
      siteUrl
      isAnimationStudio
      media(sort: [START_DATE_DESC], type: ANIME, page: $page, perPage: $perPage) {
        pageInfo { total hasNextPage }
        nodes {
          id
          title { romaji english native }
          coverImage { large color }
          averageScore
          popularity
          episodes
          status
          format
          genres
          season
          seasonYear
          isAdult
          nextAiringEpisode { airingAt episode timeUntilAiring }
        }
      }
    }
  }`;

  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: q, variables: { id: 569, page: 1, perPage: 20 } }),
  });
  console.log(await res.text());
}
run();
