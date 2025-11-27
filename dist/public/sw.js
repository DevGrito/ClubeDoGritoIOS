/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-54d0af47'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "assets/1-BlDzGB_h.png",
    "revision": null
  }, {
    "url": "assets/10-C3x7546c.png",
    "revision": null
  }, {
    "url": "assets/11-C5KfZtLa.png",
    "revision": null
  }, {
    "url": "assets/12-DSF8Xppq.png",
    "revision": null
  }, {
    "url": "assets/13-CwThpOO_.png",
    "revision": null
  }, {
    "url": "assets/14-BxDpjyhk.png",
    "revision": null
  }, {
    "url": "assets/15-T0YPsC5m.png",
    "revision": null
  }, {
    "url": "assets/2-BUpheyHI.png",
    "revision": null
  }, {
    "url": "assets/3-aofHxShr.png",
    "revision": null
  }, {
    "url": "assets/4-D13klCHO.png",
    "revision": null
  }, {
    "url": "assets/5-C2xpZ5A1.png",
    "revision": null
  }, {
    "url": "assets/6-ve805goI.png",
    "revision": null
  }, {
    "url": "assets/7-BhxdY6o3.png",
    "revision": null
  }, {
    "url": "assets/8-oiab6hH4.png",
    "revision": null
  }, {
    "url": "assets/9-C9VisHgl.png",
    "revision": null
  }, {
    "url": "assets/CAPA DEV_1763572613505-BXQcaIPO.png",
    "revision": null
  }, {
    "url": "assets/CLUBE_DO GRITO_LOGO_Prancheta 1_1751996016284-CVeckMe7.png",
    "revision": null
  }, {
    "url": "assets/CLUBEDOGRITO_APPpng_Prancheta 1_1755627303160-BWIV1B9K.png",
    "revision": null
  }, {
    "url": "assets/Gemini_Generated_Image_4go0l24go0l24go0_1763145562380-D75eu9Dy.png",
    "revision": null
  }, {
    "url": "assets/Gemini_Generated_Image_z1piwwz1piwwz1pi (1)_1763561171789-DBmQnrPW.png",
    "revision": null
  }, {
    "url": "assets/image_1756315503638-Cn_agDQ2.png",
    "revision": null
  }, {
    "url": "assets/image_1756326888573-DQpo_Do3.png",
    "revision": null
  }, {
    "url": "assets/image_1756386204050-DU_Rhz00.png",
    "revision": null
  }, {
    "url": "assets/image_1756392045123-D8WGZhCm.png",
    "revision": null
  }, {
    "url": "assets/image_1758053087579-DVJFqBid.png",
    "revision": null
  }, {
    "url": "assets/image_1758053103933-B0GnJMbq.png",
    "revision": null
  }, {
    "url": "assets/image_1758053124494-CsV7oiC2.png",
    "revision": null
  }, {
    "url": "assets/image_1758053146019-Bt5j2p1I.png",
    "revision": null
  }, {
    "url": "assets/image_1758053162624-BYnVIH-M.png",
    "revision": null
  }, {
    "url": "assets/index-BsK5YBtJ.css",
    "revision": null
  }, {
    "url": "assets/index-ZPAKQb9d.js",
    "revision": null
  }, {
    "url": "assets/index.es-D0m7TMbf.js",
    "revision": null
  }, {
    "url": "assets/LOGO_CLUBE-05_1752081350082-YOrunU7b.png",
    "revision": null
  }, {
    "url": "assets/Logo_Favela3D_GF_positivoo_1754341182028-DHk3CRqV.png",
    "revision": null
  }, {
    "url": "assets/logo-clube-grito-waves_1759419898299-ouvZoRQE.png",
    "revision": null
  }, {
    "url": "assets/logo-evento-jjoEHejS.png",
    "revision": null
  }, {
    "url": "assets/MEGAFONE SEM FUNDO_Prancheta 1_1756835037939-Tjmac89k.png",
    "revision": null
  }, {
    "url": "assets/purify.es-B6FQ9oRL.js",
    "revision": null
  }, {
    "url": "assets/QUAL ÉSEU GRITO_1756904245577-DPC2p-MZ.png",
    "revision": null
  }, {
    "url": "assets/rocket_7339928_1756908855776-xCnT9P-O.png",
    "revision": null
  }, {
    "url": "assets/stories-overlay.png",
    "revision": null
  }, {
    "url": "coin-icon.png",
    "revision": "d3f872d11116db03246eb5348baa8415"
  }, {
    "url": "icons/icon-192.png",
    "revision": "10a87a36df610aa7d47ae42cec59b3b2"
  }, {
    "url": "icons/icon-512.png",
    "revision": "f118ff07631e069f07a62db0c41dcc43"
  }, {
    "url": "index.html",
    "revision": "91cd00e5fac58e40248fc1c41785807d"
  }, {
    "url": "ingresso-foto-topo.png",
    "revision": "9bed8ec65aa6c08ed1676c68f622e6c9"
  }, {
    "url": "ingresso-novo.png",
    "revision": "346d79fbd27124d4e18ed4c91e621e45"
  }, {
    "url": "ingresso-reference.png",
    "revision": "4a4bc3d9a173c00d4b65401cbab3308e"
  }, {
    "url": "ingresso-secao-meio.png",
    "revision": "7e19f8ecbb8ecb0a1f4651be52873f90"
  }, {
    "url": "logo-amarelo.png",
    "revision": "7e19f8ecbb8ecb0a1f4651be52873f90"
  }, {
    "url": "logo192.png",
    "revision": "10a87a36df610aa7d47ae42cec59b3b2"
  }, {
    "url": "logo512.png",
    "revision": "f118ff07631e069f07a62db0c41dcc43"
  }, {
    "url": "manifest.json",
    "revision": "bacafc6b0e6c92aae17936771f97ca44"
  }, {
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "service-worker.js",
    "revision": "8a29a0d2e71af8b49ff888afab018b44"
  }, {
    "url": "ticket-design.png",
    "revision": "a0582c3dac85d0095acb990af5baa877"
  }, {
    "url": "icons/icon-192.png",
    "revision": "10a87a36df610aa7d47ae42cec59b3b2"
  }, {
    "url": "icons/icon-512.png",
    "revision": "f118ff07631e069f07a62db0c41dcc43"
  }, {
    "url": "manifest.webmanifest",
    "revision": "cc857576c8232058876692acfca47e0d"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/index.html")));

}));
