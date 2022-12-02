import { Example } from "./Types.mjs";

export const home: Example = {
  name: "home",
  store: [
    {
      store_id: "Kellerraum 1",
      name: "Fressiraum",
      storeSection: [
        {
          section_id: "Regal rechts@Kellerraum1",
          name: "Regal rechts",
          articleStock: [
            {
              article_id: "Stichsäge",
              article_count: 1,
            },
          ],
        },
      ],
    },
  ],
  article: [
    {
      article_id: "Stichsäge",
      name: "Sichsäge Black & Decker",
      count_unit: "piece",
      article_img_ref: "castle192.png",
    },
  ],
  image: [{ image_id: "castle192.png", path: "public/image/castle192.png" }],
};
