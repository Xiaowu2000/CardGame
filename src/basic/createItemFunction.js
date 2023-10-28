import itemCardData from "../assets/excelData/itemCard.json";

export default function createItemFunction(inventory, playerAttributes,isModalOpen) {

  // 根据使用物品名字， 更新玩家属性（饥饿度，水分，腹泻）
  function updatePlayerAttributes(item) {
    item.hungerRegen && (playerAttributes.hungerLevel += item.hungerRegen);
    item.hydrationRegen &&
      (playerAttributes.hydrationLevel += item.hydrationRegen);
    item.diarrheaAdd && (playerAttributes.diarrheaLevel += item.diarrheaAdd);
  }

  // 消耗一个物品
  function consumeInventory(itemName) {
    const itemArr = inventory.find((item) => item.name === itemName).itemArr;
    let item = itemArr.length && itemArr[0];
    item.count -= 1;
    if (item.count === 0) {
      itemArr.shift();
      if(itemArr.length===0){
        inventory.splice(inventory.findIndex((item) => item.name === itemName), 1);
      }
      item = null;
    }
  }

  return {
    eat: {
      transName: "吃",
      fn: function (itemName) {
        consumeInventory(itemName);
        updatePlayerAttributes(itemCardData[itemName]);
        isModalOpen.value = false;
      },
    },
    throw: {
      transName: "投掷",
      fn: function (item) {
        console.log("===throw===");
        console.log("now inventory is", inventory);
        console.log("now playerAttributes is", playerAttributes);
        console.log("now item is", item);
        console.log("===throw===");
      },
    },
  };
}
