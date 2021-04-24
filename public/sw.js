const indexFunc = () => {
  let db;
  // create a new db request for a "budget" database.
  const request = indexedDB.open("budget", 1);

  request.onupgradeneeded = function (event) {
    // create object store called "pending" and set autoIncrement to true
    db = event.target.result;
    db.createObjectStore("pending", {
      keyPath: _id,
      autoIncrement: true
    });
  };

  request.onsuccess = function (event) {
    db = event.target.result;

    // check if app is online before reading from db
    if (navigator.onLine) {
      checkDatabase();
    } else {
      saveRecord(db);
    }
  };

  request.onerror = function (event) {
    console.log("Woops! " + event.target.errorCode);
  };

  function saveRecord(record) {
    // create a transaction on the pending db with readwrite access
    const transaction = db.transaction(["pending"], "readwrite");


    // access your pending object store
    const store = transaction.objectStore("pending", );

    // add record to your store with add method.
    store.add(record);
  }

  function checkDatabase() {
    // open a transaction on your pending db
    const transaction = db.transaction(["pending"], "readwrite");
    // access your pending object store
    const store = transaction.objectStore("pending");
    // get all records from store and set to a variable
    const getAll = store.getAll();

    getAll.onsuccess = function () {
      if (getAll.result.length > 0) {
        fetch("/api/transaction/bulk", {
            method: "POST",
            body: JSON.stringify(getAll.result),
            headers: {
              Accept: "application/json, text/plain, */*",
              "Content-Type": "application/json"
            }
          })
          .then(response => response.json())
          .then(() => {

            request.createObjectStore("pending", {
              autoIncrement: true
            });

            // if successful, open a transaction on your pending db
            const transaction = db.transaction(["pending"], "readwrite");

            // access your pending object store
            const store = transaction.objectStore("pending");

            // clear all items in your store
            store.clear();
          });
      }
    }
  }
}
// let idb;

function createDB() {
  indexedDB.open('budget', 1, function (upgradeDB) {
    console.log("in createDB");
    var store = upgradeDB.createObjectStore('pending', {
      keyPath: 'id'
    });
    // store.put({id: 123, name: 'coke', price: 10.99, quantity: 200});
    // store.put({id: 321, name: 'pepsi', price: 8.99, quantity: 100});
    // store.put({id: 222, name: 'water', price: 11.99, quantity: 300});
  });
}

function readDB(transaction) {
  indexedDB.open('budget', 1).then(function (db) {
    var tx = db.transaction(['pending'], 'readwrite');
    var store = tx.objectStore('pending');
    store.put(transaction);
  }).then(function (items) {
    // Use beverage data
  });
}

function writeDB(record) {
  indexFunc.createDB();
  // open a transaction on your pending db
  const transaction = db.transaction(["pending"], "readwrite");
  // access your pending object store
  const store = transaction.objectStore("pending");
  // get all records from store and set to a variable
  const getAll = store.getAll();
  console.log(getAll);

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
          method: "POST",
          body: JSON.stringify(getAll.result),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json"
          }
        })
        //  .then(response => response.json())
        .then(() => {
          // if successful, open a transaction on your pending db
          const transaction = db.transaction(["pending"], "readwrite");

          // access your pending object store
          const store = transaction.objectStore("pending");

          // clear all items in your store
          store.clear();
        })
    }

    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            // create a transaction on the pending db with readwrite access
            const transaction = db.transaction(["pending"], "readwrite");

            // access your pending object store
            const store = transaction.objectStore("pending");

            // add record to your store with add method.
            console.log(record);
            store.put(record);
          })
      }))
  }
}

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/index.js",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

const CACHE_NAME = "static-cache-v1";
const DATA_CACHE_NAME = "data-cache-v1";

// install
self.addEventListener("install", function (evt) {
  evt.waitUntil(
    createDB()
  );
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );

  self.skipWaiting();
});

//activate
self.addEventListener("activate", function (evt) {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});



// fetch
self.addEventListener("fetch", function (evt) {
  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            writeDB(evt.request.body);
            return cache.match(evt.request);
          });
      }).catch(err => console.log(err))

    );

    return;
  }

  evt.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(evt.request).then(response => {
        return response || fetch(evt.request);
      });
    })
  );
});