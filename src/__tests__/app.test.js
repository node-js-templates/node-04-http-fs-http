const request = require("supertest");
const fs = require("fs");
const app = require("../app");

console.log("Tests are started.");

function expectText(resp, status, text) {
  expect(resp.status).toEqual(status);
  expect(resp.text).toEqual(text);
  expect(resp.headers["content-type"]).toEqual("text/html");
}

describe("Unknown path", () => {
  test("/bb status 404 & Not found", async () => {
    const resp = await request(app).get("/bb");

    expectText(resp, 404, "Not found");
  });

  test("/calc/ status 404 & Not found", async () => {
    const resp = await request(app).get("/calc/");

    expectText(resp, 404, "Not found");
  });
});

describe("Method", () => {
  test("POST /calc status 405", async () => {
    const resp = await request(app).post("/calc").query({
      operation: "add",
      a: 1,
      b: 2,
    });

    expectText(resp, 405, "Method not allowed");
  });
});

describe("Operation unknown", () => {
  const opUn = "Operation unknown";

  test("/calc unknown operation", async () => {
    const resp = await request(app).get("/calc").query({
      operation: "read",
      filename: "qq.txt",
    });

    expectText(resp, 400, opUn);
  });

  test("/calc missing operation", async () => {
    const resp = await request(app).get("/calc").query({
      a: 2,
      b: 3,
    });

    expectText(resp, 400, opUn);
  });

  test("/calc operation case", async () => {
    const resp = await request(app).get("/calc").query({
      operation: "Add",
      a: 2,
      b: 3,
    });

    expectText(resp, 400, opUn);
  });

  test("/fs unknown operation", async () => {
    const resp = await request(app).get("/fs").query({
      operation: "add",
      a: 3,
      b: 33,
    });

    expectText(resp, 400, opUn);
  });
});

describe("Calculator", () => {
  const path = "/calc";

  test("/calc add 3 55", async () => {
    const resp = await request(app).get(path).query({
      operation: "add",
      a: 3,
      b: 55,
    });

    expectText(resp, 200, "58");
  });

  test("/calc add -22 3", async () => {
    const resp = await request(app).get(path).query({
      operation: "add",
      a: -22,
      b: 3,
    });

    expectText(resp, 200, "-19");
  });

  test("/calc sub 32 5", async () => {
    const resp = await request(app).get(path).query({
      operation: "sub",
      a: 32,
      b: 5,
    });

    expectText(resp, 200, "27");
  });

  test("/calc sub 2 0", async () => {
    const resp = await request(app).get(path).query({
      operation: "sub",
      a: 2,
      b: 0,
    });

    expectText(resp, 200, "2");
  });

  test("/calc mul 4 51", async () => {
    const resp = await request(app).get(path).query({
      operation: "mul",
      a: 4,
      b: 51,
    });

    expectText(resp, 200, "204");
  });

  test("/calc div 14 7", async () => {
    const resp = await request(app).get(path).query({
      operation: "div",
      a: 14,
      b: 7,
    });

    expectText(resp, 200, "2");
  });

  test("/calc div 2 4", async () => {
    const resp = await request(app).get(path).query({
      operation: "div",
      a: 2,
      b: 4,
    });

    expectText(resp, 200, "0.5");
  });

  test("/calc div by zero", async () => {
    const resp = await request(app).get(path).query({
      operation: "div",
      a: 1,
      b: 0,
    });

    expectText(resp, 400, "Division by zero");
  });

  test("/calc missing b", async () => {
    const resp = await request(app).get(path).query({
      operation: "add",
      a: 2,
    });

    expectText(resp, 400, "Invalid arguments");
  });

  test("/calc blank a", async () => {
    const resp = await request(app).get("/calc?operation=add&a=%20%20&b=1");

    expectText(resp, 400, "Invalid arguments");
  });

  test("/calc non-numeric a", async () => {
    const resp = await request(app).get(path).query({
      operation: "add",
      a: "abc",
      b: 1,
    });

    expectText(resp, 400, "Invalid arguments");
  });
});

describe("File System", () => {
  const path = "/fs";

  test("/fs create tf988.txt smart inside", async () => {
    const fileName = "tf988.txt";
    try {
      const resp = await request(app).get(path).query({
        operation: "create",
        filename: fileName,
        text: "smart inside",
      });

      expectText(resp, 201, `${fileName} was created`);
      expect(fs.readFileSync(fileName, "utf8")).toEqual("smart inside");
    } finally {
      if (fs.existsSync(fileName)) fs.unlinkSync(fileName);
    }
  });

  test("/fs create empty text", async () => {
    const fileName = "empty.txt";
    try {
      const resp = await request(app).get(
        `${path}?operation=create&filename=${fileName}&text=`
      );

      expectText(resp, 201, `${fileName} was created`);
      expect(fs.readFileSync(fileName, "utf8")).toEqual("");
    } finally {
      if (fs.existsSync(fileName)) fs.unlinkSync(fileName);
    }
  });

  test("/fs create overwrites aloha.txt", async () => {
    const fileName = "aloha.txt";
    fs.writeFileSync(fileName, "hello", "utf8");
    try {
      const resp = await request(app).get(path).query({
        operation: "create",
        filename: fileName,
        text: "again",
      });

      expectText(resp, 200, `${fileName} was updated`);
      expect(fs.readFileSync(fileName, "utf8")).toEqual("again");
    } finally {
      if (fs.existsSync(fileName)) fs.unlinkSync(fileName);
    }
  });

  test("/fs roundtrip utf-8", async () => {
    const fileName = "tf-utf8.txt";
    const text = "привіт";
    try {
      const created = await request(app).get(path).query({
        operation: "create",
        filename: fileName,
        text,
      });

      expectText(created, 201, `${fileName} was created`);
      expect(fs.readFileSync(fileName, "utf8")).toEqual(text);

      const read = await request(app).get(path).query({
        operation: "read",
        filename: fileName,
      });

      expectText(read, 200, text);
    } finally {
      if (fs.existsSync(fileName)) fs.unlinkSync(fileName);
    }
  });

  test("/fs create without text", async () => {
    const fileName = "tf-no-text.txt";
    if (fs.existsSync(fileName)) fs.unlinkSync(fileName);
    try {
      const resp = await request(app).get(path).query({
        operation: "create",
        filename: fileName,
      });

      expectText(resp, 400, "Invalid arguments");
      expect(fs.existsSync(fileName)).toEqual(false);
    } finally {
      if (fs.existsSync(fileName)) fs.unlinkSync(fileName);
    }
  });

  test("/fs read tf989.txt", async () => {
    const fileName = "tf989.txt";
    const text = "---------____------------_____----";
    fs.writeFileSync(fileName, text, "utf8");
    try {
      const resp = await request(app).get(path).query({
        operation: "read",
        filename: fileName,
      });

      expectText(resp, 200, text);
    } finally {
      if (fs.existsSync(fileName)) fs.unlinkSync(fileName);
    }
  });

  test("/fs read missing qq.txt", async () => {
    const fileName = "qq.txt";
    if (fs.existsSync(fileName)) fs.unlinkSync(fileName);

    const resp = await request(app).get(path).query({
      operation: "read",
      filename: fileName,
    });

    expectText(resp, 404, "File not found");
  });

  test("/fs read without filename", async () => {
    const resp = await request(app).get(path).query({
      operation: "read",
    });

    expectText(resp, 400, "Invalid arguments");
  });
});
