const { log } = require("console");
const csv = require("csvtojson");
const fs = require("fs");

const itemCardCsvPath = "../assets/excelData/itemCard.csv";

// 转换函数
function convertCsvToJson() {
  csv()
    .fromFile(itemCardCsvPath)
    .then((jsonArray) => {
      const jsonObject = {};
      jsonArray.forEach((item) => {
        const itemName =
          item.ItemName[0].toLowerCase() + item.ItemName.slice(1);
        delete item.ItemName; // 删除原来的ItemName属性

        let cleanedAttributes = {name: itemName};

        for (let key in item) {
          let value = item[key];

          if (item[key] === "") continue

          // 如果值可以转换为数字，那么转换它
          if (!isNaN(value)) item[key] = +value;
          //如果值为null,改为null
          if (value === "null") item[key] = null;

          let cleanedKey = key[0].toLowerCase() + key.slice(1);
          cleanedAttributes[cleanedKey] = item[key];
        }
        jsonObject[itemName] = cleanedAttributes;
      });

      fs.writeFile(
        "../assets/excelData/itemCard.json",
        JSON.stringify(jsonObject),
        (err) => {
          if (err) {
            console.error("Error writing JSON:", err);
          } else {
            console.log("CSV converted to JSON successfully!");
          }
        }
      );
    });
}

// 初始转换
convertCsvToJson();

//监听CSV文件变化
fs.watch(itemCardCsvPath, (eventType, filename) => {
  if (eventType === "change") {
    console.log(`${filename} has changed. Converting to JSON...`);
    convertCsvToJson();
  }
});
