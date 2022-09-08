const vscode = require("vscode");
var Rcon = require("rcon");
const path = require("path");

let conn;

function disconnect() {
  if (conn) {
    conn.disconnect();
    conn = null;
    vscode.window.showWarningMessage("Disconnected");
  }
}

function connnect(password, ip, port) {
  console.log(password, ip, port);
  if (!ip && !port) {
    ip = "127.0.0.1";
    port = "30120";
  }
  disconnect();
  conn = new Rcon(ip, port, password, {
    tcp: false,
    challenge: false,
  });

  conn
    .on("auth", function () {
      console.log("Authenticated");
      conn.send("refresh");
    })
    .on("response", function (str) {
      console.log(str);

      if (str === "rint Invalid password") {
        vscode.window.showErrorMessage("Invalid password");
      }

      if (str.indexOf("rint ^2Scanning resources.^7") >= 0) {
        vscode.window.showInformationMessage("Connected");
      }
    })
    .on("error", function (err) {
      console.log("Error: " + err);
      vscode.window.showErrorMessage("Error: " + err);
    })
    .on("end", function () {
      console.log("Connection closed");
      vscode.window.showErrorMessage("Connection closed");
      process.exit();
    });

  conn.connect();
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  vscode.workspace.onDidSaveTextDocument((document) => {
    if (document.uri.scheme === "file" && conn) {
      vscode.workspace.workspaceFolders.forEach((folder) => {
        conn.send(`ensure ${folder.name}`);
      });
    }
  });

  let connect = vscode.commands.registerCommand(
    "easy-fivem.connect",
    async function () {
      const password = await vscode.window.showInputBox({
        placeHolder: "password",
        prompt: "your server rcon password",
      });
      if (password && password !== "") {
        connnect(password);
      } else {
        vscode.window.showErrorMessage("no valid password!");
      }
    }
  );

  context.subscriptions.push(connect);

  let disconnect = vscode.commands.registerCommand(
    "easy-fivem.disconnect",
    function () {
      if (conn) {
        conn.disconnect();
        conn = null;
        vscode.window.showWarningMessage("Disconnected");
      }
    }
  );

  context.subscriptions.push(disconnect);

  let customConnect = vscode.commands.registerCommand(
    "easy-fivem.customConnect",
    async function () {
      let port;
      let ip = await vscode.window.showInputBox({
        placeHolder: "ip:port",
        prompt: "your server ip and port",
      });

      port = ip.split(":")[1];
      ip = ip.split(":")[0];

      const password = await vscode.window.showInputBox({
        placeHolder: "password",
        prompt: "your server rcon password",
      });
      if (
        password &&
        password !== "" &&
        ip &&
        ip !== "" &&
        port &&
        port !== ""
      ) {
        connnect(password, ip, port);
      } else {
        vscode.window.showErrorMessage("no valid password!");
      }
    }
  );

  context.subscriptions.push(customConnect);
}

// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
