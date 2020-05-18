const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Wit, log } = require("node-wit");
const math = require("mathjs");
const wordnet = require("wordnet");
const client = new Wit({
  accessToken: "2TKBSE3TDXMVZAME75GWBTFUQCB3AAVB",
});
const app = express();

app.use(cors());

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function processWitResponse(raw_response) {
  return new Promise(function (resolve, reject) {
    try {
      if (
        raw_response.entities &&
        raw_response.entities.intent &&
        raw_response.entities.intent[0].value &&
        raw_response.entities.intent[0].confidence > 0.85
      ) {
        switch (raw_response.entities.intent[0].value) {
          case "math":
            let result;
            const expression =
              raw_response &&
              raw_response.entities &&
              raw_response.entities.math_expression[0].value;
            if (
              (raw_response &&
                raw_response.entities &&
                raw_response.entities.math_operation &&
                raw_response.entities.math_operation[0].value ==
                  "differentiate") ||
              raw_response.entities.math_operation[0].value == "derivative"
            ) {
              result = math.derivative(String(expression), "x", {
                simplify: false,
              });
            } else if (
              (raw_response &&
                raw_response.entities &&
                raw_response.entities.math_operation &&
                raw_response.entities.math_operation[0].value == "integral") ||
              raw_response.entities.math_operation[0].value == "integration" ||
              raw_response.entities.math_operation[0].value == "integrate"
            ) {
              throw new Error("sorry iam bad in doing integrations");
            } else {
              result = math.evaluate(String(expression));
            }
            resolve(result.toString());
            break;

          case "meaning":
            if (
              raw_response.entities.search_query &&
              raw_response.entities.search_query[0].value
            ) {
              wordnet.lookup(
                String(
                  raw_response.entities.search_query &&
                    raw_response.entities.search_query[0].value
                ),
                function (err, def) {
                  if (err) throw new Error("cant find the meaning");
                  def.forEach(function (definition) {
                    resolve(definition.glossary);
                  });
                }
              );
            } else if (
              raw_response.entities.math_operation &&
              raw_response.entities.math_operation[0].value
            ) {
              const arr = raw_response.entities.math_operation[0].value.split(
                " "
              );
              const word = arr[arr.length - 1];
              wordnet.lookup(word, function (err, def) {
                if (err) throw new Error("cant find the meaning");
                def.forEach(function (definition) {
                  resolve(definition.glossary);
                });
              });
            } else if (
              raw_response.entities.math_expression &&
              raw_response.entities.math_expression[0].value
            ) {
              const arr = raw_response.entities.math_expression[0].value.split(
                " "
              );
              const word = arr[arr.length - 1];
              wordnet.lookup(word, function (err, def) {
                if (err) throw new Error("cant find the meaning");
                def.forEach(function (definition) {
                  resolve(definition.glossary);
                });
              });
            } else {
              reject(
                "couldnt find the the word from the sentence for which i have to take a look on the meaning"
              );
            }

            break;

          case "gentle":
            if (
              raw_response.entities.sentiment &&
              raw_response.entities.sentiment[0].value
            ) {
              switch (raw_response.entities.sentiment[0].value) {
                case "positive":
                  resolve("thanks.... cool!");
                  break;
                case "neutral":
                  resolve("yeah !");
                  break;
                case "negative":
                  resolve("fine..ill try to improve");
                  break;
              }
            } else {
              s;
              resolve("thanks!");
            }
            break;

          case "greet":
            resolve("heyy hi buddy!");
            break;

          default:
            reject("sorry I dont know that");
        }
      } else {
        reject("not sure about it!");
      }
    } catch (e) {
      reject(e.message);
    }
  });
}

// io.on("connection", (socket) => {
//   console.log("new connection initiated");
//   let user;
//   socket.on("uuid", (value) => {
//     user = value;
//     socket.on(user, (value) => {
//       client
//         .message(value, {})
//         .then(async (response) => {
//           const result = processWitResponse(response);
//           result
//             .then((res) => {
//               io.emit(user + "response", String(res));
//             })
//             .catch((err) => {
//               io.emit(user + "response", String(err));
//             });
//         })
//         .catch((err) => {
//           io.emit(user + "response", err);
//         });
//     });
//   });
// // });


app.get('/', (req,res) => {
  res.json({"status":200, "name": "Tweak", "function":"chatbot"})
})



app.post('/message', (req,res) => {
  const message = req.body.message;

  client
        .message(message, {})
        .then(async (response) => {
          const result = processWitResponse(response);
          result
            .then((result) => {
              // io.emit(user + "response", String(res));
              res.json({
                message:String(result)})
            })
            .catch((err) => {
              res.json({
                message:String(err)})
            });
        })
        .catch((err) => {
          res.json({
            message:String(err)})
        });
})

app.listen(process.env.PORT || 8080, ()=> {
  console.log("server running on ", process.env.PORT || 8080)
})
