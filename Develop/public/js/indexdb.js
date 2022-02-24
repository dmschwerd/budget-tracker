const indexedDB =
  window.indexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.mozIndexedDB ||
  window.shimIndexedDB;

let indexdb;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = ({ target }) => {
  let indexdb = target.result;
  indexdb.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = ({ target }) => {
  indexdb = target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function(event) {
  console.log(event.target.errorCode);
};

function checkDatabase() {
  const transaction = indexdb.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => {
        return response.json();
      })
      .then(() => {
        const transaction = indexdb.transaction(["pending"], "readwrite");
        const store = transaction.objectStore("pending");
        store.clear();
      });
    }
  };
}

function saveRecord(record) {
  const transaction = indexdb.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");

  store.add(record);
}

window.addEventListener("online", checkDatabase);