## What you are building

A small HTTP server with two jobs: do arithmetic, and read or write a text file.

The tests in [src/__tests__](./src/__tests__) check the status codes and the response text exactly, so the messages below are part of the task. Leave that folder as it is.

## Where the code goes

Create the server with `http.createServer()` in [src/app.js](./src/app.js) and export it with `module.exports`. The tests import that export.

[index.js](./index.js) is already written. It starts the server.

## How a request is handled

Parse the URL with `url.parse(req.url, true)`.

- The path is `pathname`.
- The parameters are `query`. The second argument, `true`, is what turns the query string into an object.

Then check, in this order:

1. HTTP method
2. Path
3. `operation`
4. Parameters
5. The arithmetic, or the file

Only `GET` is accepted. Any other method gets status `405` and the text `Method not allowed`.

The path has to match exactly, including capital letters and a slash at the end. `/calc/` and `/Calc` are not `/calc`. `operation` works the same way: `Add` is not `add`.

Every response, including an error, sets `Content-Type` to exactly `text/html`. The body is plain text: the result, or one error message.

## Calculator, `GET /calc`

Read `operation`, `a`, and `b` from the query. Each value is one string.

`operation` is one of `add`, `sub`, `mul`, or `div`. If it is missing or anything else, answer with `400` and `Operation unknown`.

`a` and `b` are both required. A value is usable when it is a string, it is not blank after trimming, and `Number` of that string is a finite number. An empty value, spaces only, `Infinity`, or a word gets `400` and `Invalid arguments`.

A successful result is status `200`. The body is the ordinary decimal text of the number, such as `5`, `-19`, or `0.5`.

Dividing by zero, including `0/0`, gets `400` and `Division by zero`. Zero is a normal operand for `add`, `sub`, and `mul`.

| Request | Status | Text |
|---|---|---|
| /calc?operation=add&a=2&b=3 | 200 | 5 |
| /calc?operation=add&a=-22&b=3 | 200 | -19 |
| /calc?operation=sub&a=2&b=3 | 200 | -1 |
| /calc?operation=sub&a=2&b=0 | 200 | 2 |
| /calc?operation=mul&a=2&b=3 | 200 | 6 |
| /calc?operation=mul&a=4&b=0 | 200 | 0 |
| /calc?operation=div&a=22&b=11 | 200 | 2 |
| /calc?operation=div&a=2&b=4 | 200 | 0.5 |
| /calc?operation=div&a=1&b=0 | 400 | Division by zero |
| /calc?operation=add&a=2 | 400 | Invalid arguments |
| /calc?operation=add&a=%20%20&b=1 | 400 | Invalid arguments |
| /calc?operation=add&a=abc&b=1 | 400 | Invalid arguments |
| /calc?a=2&b=3 | 400 | Operation unknown |
| /calc?operation=Add&a=2&b=3 | 400 | Operation unknown |

## Files, `GET /fs`

Read `operation`, `filename`, and `text` from the query. Each value is one string.

`operation` is `create` or `read`. Check this before the other parameters and before touching the disk. Anything else gets `400` and `Operation unknown`.

`filename` is required for both operations. `text` is required for `create`, and it may be an empty string. A missing `filename`, a missing `text` on `create`, or a value that is not a single string gets `400` and `Invalid arguments`. A `create` without `text` does not create the file.

The filename is relative to the process working directory. Read and write the file as UTF-8, and send the response after that work has finished.

- A new file gets `201` and `{filename} was created`. The file then contains `text`, even when `text` is empty.
- An existing file is overwritten. The response is `200` and `{filename} was updated`.
- A successful read gets `200` and the file contents.
- A missing file gets `404` and `File not found`.

| Request | Status | Text |
|---|---|---|
| /fs?operation=create&filename=tf.txt&text=23 | 201 | tf.txt was created |
| /fs?operation=create&filename=aloha.txt&text=hello | 201 | aloha.txt was created |
| /fs?operation=create&filename=empty.txt&text= | 201 | empty.txt was created |
| file already exists: /fs?operation=create&filename=aloha.txt&text=again | 200 | aloha.txt was updated |
| /fs?operation=create&filename=tf.txt | 400 | Invalid arguments |
| /fs?operation=read&filename=aloha.txt | 200 | hello |
| /fs?operation=read&filename=qq.txt | 404 | File not found |
| /fs?operation=read | 400 | Invalid arguments |
| /fs?operation=add&a=3&b=33 | 400 | Operation unknown |

## Other paths

A path other than `/calc` or `/fs` gets `404` and `Not found`.

| Request | Status | Text |
|---|---|---|
| /calc/ | 404 | Not found |
| /psss | 404 | Not found |
| /calc?operation=read&filename=qq.txt | 400 | Operation unknown |
| POST /calc?operation=add&a=1&b=2 | 405 | Method not allowed |

## Running tests

Install the dependencies with `npm i`, then run `npm test`.
