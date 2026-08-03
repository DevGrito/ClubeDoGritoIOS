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
    "url": "assets/CLUBEDOGRITO_APPpng_Prancheta 1_1755627303160-BWIV1B9K.png",
    "revision": null
  }, {
    "url": "assets/dev-marketing-CLpj8CC7.js",
    "revision": null
  }, {
    "url": "assets/face-api.esm-DtFQjyl5.js",
    "revision": null
  }, {
    "url": "assets/Gemini_Generated_Image_b8g3y7b8g3y7b8g3_1769198371783-BZEX8ARK.png",
    "revision": null
  }, {
    "url": "assets/html2canvas.esm-B0tyYwQk.js",
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
    "url": "assets/image_1764861877259-C6PZ_otH.png",
    "revision": null
  }, {
    "url": "assets/image_1769199255257-D_0JMbrD.png",
    "revision": null
  }, {
    "url": "assets/image_1769454113778-kbBzN7i1.png",
    "revision": null
  }, {
    "url": "assets/index-BWIZ0Eed.css",
    "revision": null
  }, {
    "url": "assets/index-D-0Ft0uS.js",
    "revision": null
  }, {
    "url": "assets/index.es-BlpzWOKM.js",
    "revision": null
  }, {
    "url": "assets/jspdf.plugin.autotable-BBLUVd7n.js",
    "revision": null
  }, {
    "url": "assets/Logo_Clube_Do_grito-CVeckMe7.png",
    "revision": null
  }, {
    "url": "assets/Logo_Favela3D_GF_positivoo_1754341182028-DHk3CRqV.png",
    "revision": null
  }, {
    "url": "assets/LOGO_IOG-02_1777395980729-CT_kFlv-.png",
    "revision": null
  }, {
    "url": "assets/logo-clube-grito-waves_1759419898299-ouvZoRQE.png",
    "revision": null
  }, {
    "url": "assets/MEGAFONE SEM FUNDO_Prancheta 1_1756835037939-Tjmac89k.png",
    "revision": null
  }, {
    "url": "assets/migrated/BG_1756832442490.png",
    "revision": null
  }, {
    "url": "assets/migrated/HIFH FIVE_Prancheta 1 1_1757421141870.png",
    "revision": null
  }, {
    "url": "assets/migrated/image (7)_1756832872920.png",
    "revision": null
  }, {
    "url": "assets/migrated/image_1756491369207.png",
    "revision": null
  }, {
    "url": "assets/migrated/image_1756491440300.png",
    "revision": null
  }, {
    "url": "assets/migrated/image_1756491479690.png",
    "revision": null
  }, {
    "url": "assets/migrated/image_1756491507581.png",
    "revision": null
  }, {
    "url": "assets/migrated/image_1756491533634.png",
    "revision": null
  }, {
    "url": "assets/migrated/image_1758819895383.png",
    "revision": null
  }, {
    "url": "assets/migrated/image_1769454113778.png",
    "revision": null
  }, {
    "url": "assets/migrated/OPPS_Prancheta 1 1_1756924526569.png",
    "revision": null
  }, {
    "url": "assets/monitor-C8x7CZBL.js",
    "revision": null
  }, {
    "url": "assets/QUAL ÉSEU GRITO_1756904245577-DPC2p-MZ.png",
    "revision": null
  }, {
    "url": "assets/rocket_7339928_1756908855776-xCnT9P-O.png",
    "revision": null
  }, {
    "url": "assets/ScannerPresencaModal-DeV71ZQL.js",
    "revision": null
  }, {
    "url": "assets/stories-overlay.png",
    "revision": null
  }, {
    "url": "assets/web-CcxUZWvC.js",
    "revision": null
  }, {
    "url": "coin-icon.png",
    "revision": "d3f872d11116db03246eb5348baa8415"
  }, {
    "url": "favicon.ico",
    "revision": "10a87a36df610aa7d47ae42cec59b3b2"
  }, {
    "url": "favicon.png",
    "revision": "10a87a36df610aa7d47ae42cec59b3b2"
  }, {
    "url": "firebase-messaging-sw.js",
    "revision": "6d24fff67fe69761b77214bd199b09fb"
  }, {
    "url": "icons/badge-96.png",
    "revision": "553a781109902f53660a2e241399e83b"
  }, {
    "url": "icons/icon-192.png",
    "revision": "553a781109902f53660a2e241399e83b"
  }, {
    "url": "icons/icon-512.png",
    "revision": "553a781109902f53660a2e241399e83b"
  }, {
    "url": "index.html",
    "revision": "4de3341fba9b44cea6e2a6f34e6c38d4"
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
    "url": "logo_ogrito.png",
    "revision": "fe14c3f64430bc2f3e4664c0253c2ac3"
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
    "revision": "1a3071efec2fc99f54280588e6232f4e"
  }, {
    "url": "models/face_landmark_68_tiny_model-weights_manifest.json",
    "revision": "ae8a09f24ac26b863bc9b1d025e71d14"
  }, {
    "url": "models/face_recognition_model-weights_manifest.json",
    "revision": "1b056fd5dd4ddc1b83edc726a32c973e"
  }, {
    "url": "models/tiny_face_detector_model-weights_manifest.json",
    "revision": "862f9faaeb421d87a569666df52b84d2"
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
    "url": "favicon.ico",
    "revision": "10a87a36df610aa7d47ae42cec59b3b2"
  }, {
    "url": "icons/icon-192.png",
    "revision": "553a781109902f53660a2e241399e83b"
  }, {
    "url": "icons/icon-512.png",
    "revision": "553a781109902f53660a2e241399e83b"
  }, {
    "url": "manifest.webmanifest",
    "revision": "cc857576c8232058876692acfca47e0d"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("/index.html")));

}));
