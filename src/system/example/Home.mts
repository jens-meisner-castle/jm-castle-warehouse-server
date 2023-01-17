import { DateTime } from "luxon";
import { Example } from "./Types.mjs";

export const home: Example = {
  name: "home",
  store: [
    {
      store_id: "Kellerraum 1",
      name: "Fressiraum",
      image_refs: '["castle192.png"]',
      storeSection: [
        {
          section_id: "Regal rechts@Kellerraum1",
          name: "Regal rechts",
          image_refs: '["castle192.png"]',
          articleStock: [
            {
              article_id: "Stichsäge",
              article_count: 1,
              image_refs: '["castle192.png"]',
              guaranty_to: Math.floor(
                DateTime.fromFormat(
                  "1999-11-30 00:00",
                  "yyyy-LL-dd HH:mm"
                ).toMillis() / 1000
              ),
              www_link: null,
              reason: "buy",
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
      www_link:
        "https://www.lidl.de/p/parkside-pendelhubstichsaege-pstd-800-c3/p100335590?mktc=shopping_shop&gclid=CjwKCAiAk--dBhABEiwAchIwkZ89C23oQ1xOzUN19csQ99VR5ZlAaMTseZS8HnJxm47B4SZ4eTyJoBoCKiMQAvD_BwE",
      hashtags: '["werkzeug"]',
      count_unit: "piece",
      image_refs: '["castle192.png"]',
    },
  ],
  hashtag: [
    {
      tag_id: "werkzeug",
      name: "Werkzeuge generell (manuell und elektrisch)",
    },
  ],
  image: [{ image_id: "castle192.png", path: "public/image/castle192.png" }],
};
