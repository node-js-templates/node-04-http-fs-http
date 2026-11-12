## Description

  
- An HTTP server is created using the `http.createServer()` method in `./src/app.js`.

- The server listens for requests from clients in `./index.js`.

- The request URL is parsed with `url.parse(req.url, true)`. The path is `q.pathname`. The parameters are `q.query`, the object produced by the `true` argument.

- Checks run in this order: HTTP method, path, `operation`, parameters, then arithmetic or the file.

- The server accepts only `GET`. Any other method receives `"Method not allowed"` and a status code of `405`.

- The path is matched exactly, including letter case and a trailing slash. `/calc/` and `/Calc` do not match `/calc`. `operation` is matched the same way: `Add` does not match `add`.

- If the request path is `/calc`, the calculator operation is performed.

  - The parameters `operation`, `a`, and `b` are read from `q.query`. Each parameter must be a single string.

  - `operation` is one of `add`, `sub`, `mul`, or `div`. A missing or different value receives `"Operation unknown"` and a status code of `400`.

  - `a` and `b` are required. A value is accepted when it is a string, it is not blank after trimming, and `Number` of that string is finite. An empty value, spaces only, `Infinity`, and a non-numeric value receive `"Invalid arguments"` and a status code of `400`.

  - The accepted numbers are added, subtracted, multiplied, or divided. The body is the ordinary decimal text of the result, such as `5`, `-19`, or `0.5`.

  - Division by zero, including `0/0`, receives `"Division by zero"` and a status code of `400`. Zero is a valid operand for `add`, `sub`, and `mul`.

  - A successful result is sent with a status code of `200`.

- If the request path is `/fs`, the file handling operation is performed.

  - The parameters `operation`, `filename`, and `text` are read from `q.query`. Each parameter must be a single string.

  - `operation` is `create` or `read`. A missing or different value receives `"Operation unknown"` and a status code of `400`. This check comes before the parameter and file checks.

  - `filename` is required for `create` and `read`. `text` is required for `create` and may be an empty string. A missing `filename`, a missing `text` on `create`, or a parameter that is not a single string receives `"Invalid arguments"` and a status code of `400`.

  - A filename is relative to the process working directory. The file is read and written as UTF-8. The response is sent after that operation has finished.

  - `create` writes `text` into `filename`. A new file receives `{filename} was created` and a status code of `201`. An existing file is overwritten and receives `{filename} was updated` with a status code of `200`.

  - `read` returns the file contents with a status code of `200`. A missing file receives `"File not found"` and a status code of `404`.

- If the request path does not match `/calc` or `/fs`, the server responds with `"Not found"` and a status code of `404`.

- Every response, including an error, sets the `Content-Type` header to exactly `text/html`.

- The response body is the operation result or the error message.

- The web server is exported for use in other modules using `module.exports`.

  

## Functional examples

| **Request** | **Response : Status** | **Response : Text** |
|--|--|--|
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
| /calc/ | 404 | Not found |
| POST /calc?operation=add&a=1&b=2 | 405 | Method not allowed |
| /fs?operation=create&filename=tf.txt&text=23 | 201 | tf.txt was created |
| /fs?operation=create&filename=aloha.txt&text=hello | 201 | aloha.txt was created |
| /fs?operation=create&filename=empty.txt&text= | 201 | empty.txt was created |
| file already exists: /fs?operation=create&filename=aloha.txt&text=again | 200 | aloha.txt was updated |
| /fs?operation=create&filename=tf.txt | 400 | Invalid arguments |
| /fs?operation=read&filename=aloha.txt | 200 | hello |
| /fs?operation=read&filename=qq.txt | 404 | File not found |
| /fs?operation=read | 400 | Invalid arguments |
| /calc?operation=read&filename=qq.txt | 400 | Operation unknown |
| /fs?operation=add&a=3&b=33 | 400 | Operation unknown |
| /psss | 404 | Not found |

After a successful `create`, the file in the working directory contains `text`, including when `text` is empty. A `create` without `text` does not create the file.

## Running tests
Run `npm i` for installing dependencies, and then `npm run test` for running tests.  Please refrain from making any changes in the [tests](./src/__tests__) folder.
