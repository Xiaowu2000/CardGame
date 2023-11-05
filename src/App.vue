<script setup>
import itemCardData from './assets/excelData/itemCard.json';
import createItemFunction from './basic/createItemFunction.js';
import draggable from 'vuedraggable'
import { ref, reactive } from 'vue'

//玩家属性
const player = reactive({
  hungerLevel: 100, // 饥饿程度
  diarrheaLevel: 0, // 拉肚子的程度
  hydrationLevel: 100, // 水分程度
  bodyTemperature: 36.5, // 体温
  time: 0, // 一天中的分钟数，早上0点开始
})

//玩家物品栏
const playerInventory = reactive([
  {
    name: 'banana',
    itemArr: [{ count: 1, freshness: 100, totalFreshness: 300 }, { count: 3, freshness: 200, totalFreshness: 300 }]
  },
  { name: 'coconut', itemArr: [{ count: 1, freshness: 150, totalFreshness: 300 }, { count: 3, freshness: 200, totalFreshness: 300 }] },
  { name: 'stone', itemArr: [{ count: 1, }] },
  { name: 'durian', itemArr: [{ count: 1, freshness: 100, totalFreshness: 300 }] },
  { name: 'water', itemArr: [{ count: 1, freshness: 100, totalFreshness: 300 }] },
])


// 用于追踪交互模式
const interactionMode = ref(false);
const cardClickTimer = null;

console.log(itemCardData);

//单击打开物品信息
const selectedItemInfo = ref({});
const selectedItemInfoMap = new Map()
const isModalOpen = ref(false);

const itemFunctionMap = createItemFunction(playerInventory, player, isModalOpen)

// 单击卡片显示更多信息
function handleClick(itemName) {
  // 弹出一个信息框，显示物品的详细信息
  const itemDetails = itemCardData[itemName];
  // 设置选中的物品
  setSelectedItemAttr(itemDetails);

  isModalOpen.value = true;  // 打开模态窗口

}

function setSelectedItemAttr(itemDetails) {

  // 如果选中的物品和当前物品相同，不做处理
  if (selectedItemInfo.value.name === itemDetails.name) {
    return;
  }

  // 如果选中的物品和当前物品不同，如果已经缓存了该物品的信息，直接从缓存中取出
  if (selectedItemInfoMap.has(itemDetails.name)) {
    selectedItemInfo.value = selectedItemInfoMap.get(itemDetails.name);
    return;
  }

  // 创建一个新对象，用于存储选中物品的信息
  const temp = Object.assign({}, itemDetails);

  // 缓存该物品的信息
  selectedItemInfoMap.set(itemDetails.name, temp);

  // 处理物品的功能数组
  temp.funcObjArr = [];
  if (itemDetails.function) {
    itemDetails.function.split(',').forEach((item) => {
      // item样式为：'eat(10)',需要提取出函数名和参数
      const funcName = item.match(/^[a-zA-Z]+/)[0];
      const param = item.match(/\((.+)\)/)[1];

      temp.funcObjArr.push({
        funcName,
        run: () => { itemFunctionMap[funcName].run(temp.name, param) },
        transName: itemFunctionMap[funcName].transName,
        param
      });

    });
  }

  selectedItemInfo.value = temp;
}

// 双击事件处理
function selectItemForInteraction(itemName) {
  console.log('activateInteractionMode', itemName)
  if (selectedItemInfo.value.value && selectedItemInfo.value.value !== itemName) {
    // 如果已经有选中的物品，那么执行交互逻辑
    // ...

    // 交互完成后，清除选中状态
    selectedItemInfo.value.value = null;
  } else {
    // 否则，设置此物品为选中状态
    selectedItemInfo.value.value = itemName;
  }
  interactionMode.value = !interactionMode.value;
  selectedItemInfo.value.value = itemName;
}

const itemCard = itemCardData



function searchForItem() {
  const distribution = [1, 2, 2, 3]
  const randomIndex = Math.floor(Math.random() * distribution.length);
  const itemNum = distribution[randomIndex];

  for (let i = 0; i < itemNum; i++) {
    const itemCardArr = Object.keys(itemCard);
    const randomIndex = Math.floor(Math.random() * (itemCardArr).length);
    const foundItemName = itemCardArr[randomIndex];
    addItemToInventory(foundItemName, 1)
    console.log(`你找到了一个 ${foundItemName}!`);
  }

  // 搜寻食物会消耗时间和体力
  player.time += 15;
  player.hungerLevel -= 5
  player.hydrationLevel -= 5

  if (player.time >= 720 && player.time < 1080) {
    // 如果是中午，因为天气炎热，体温会升高，消耗更多水分
    player.bodyTemperature += 0.5;
    player.hydrationLevel -= 5;
  } else if (player.time >= 1080 || player.time < 360) {
    // 如果是晚上，因为可见度不够，寻找食物会消耗更多时间
    player.time += 5;
  }

  // 检查角色状态
  checkPlayerStatus();
}

function addItemToInventory(item, quantity) {
  const itemIndex = playerInventory.findIndex((element) => element.name === item);
  if (itemIndex !== -1) {
    playerInventory[itemIndex].itemArr.push({
      count: quantity,
      freshness: itemCardData[item].freshness,
      totalFreshness: itemCardData[item].freshness
    })
    return
  }else{
    playerInventory.push({
      name: item,
      itemArr: [{
        count: quantity,
        freshness: itemCardData[item].freshness,
        totalFreshness: itemCardData[item].freshness
      }]
    })
  }
}

function checkPlayerStatus() {
  // 如果饥饿程度太高，角色会死亡

  if (player.hungerLevel <= 0) {
    console.log("你饿死了。");
    return;
  }

  // 如果水分程度太低，角色会死亡
  if (player.hydrationLevel <= 0) {
    console.log("你因为缺水而死亡。");
    return;
  }

  // 如果体温太高，角色会死亡
  if (player.bodyTemperature >= 42) {
    console.log("你因为中暑而死亡。");
    return;
  }
}

function formatTime(minutesPassed) {
  const minutesInADay = 24 * 60;
  const days = Math.floor(minutesPassed / minutesInADay) + 1;  // +1 because we start from day 1
  const hours = Math.floor((minutesPassed % minutesInADay) / 60);
  const minutes = minutesPassed % 60;

  return `第${days}天 ${hours}时 ${minutes}分`;
}
</script>

<template>
  <!-- 物品详情模态框 -->
  <div v-if="isModalOpen" class="modal-overlay" @click="isModalOpen = false">
    <div class="modal-content" @click.stop>
      <h2>{{ selectedItemInfo.transName }}</h2>
      <p>{{ selectedItemInfo.description }}</p>

      <!-- 物品功能按钮组 -->
      <div class="itemFunctionContainer">
        <template v-for="funcObj in selectedItemInfo.funcObjArr">
          <button class="itemFunction" @click="funcObj.run()">
            {{ funcObj.transName }}
            <p style="font-size: 12px;">({{ funcObj.param / 60 >= 1 ? `${funcObj.param / 60}小时` :
              `${funcObj.param}分钟` }})</p>
          </button>
        </template>
      </div>
      <!-- 其他详细信息可以在此处展示 -->
    </div>
  </div>

  <div>
    <!-- 角色属性卡片 -->
    <div class="characterCard" @click="testDblClick">
      <h2>角色属性</h2>
      <p>时间: {{ formatTime(player.time) }}</p>
      <p>饥饿度: {{ player.hungerLevel }}%</p>
      <p>口渴度: {{ player.hydrationLevel }}%</p>
      <p>体温: {{ player.bodyTemperature }}度</p>
      <p>腹泻值: {{ player.diarrheaLevel }}%</p>
      <button @click="searchForItem">
        <h2>寻找食物</h2>
      </button>

    </div>

    <!-- 物品卡片 -->
    <div>
      <h2>物品栏:</h2>
      <draggable :list="playerInventory" group="playerInv" item-key="name" class="inventoryContainer" delay="200"
        swapThreshold="1" ghostClass="ghost" dragClass="drag" touchStartThreshold="50" animation="100">
        <template #item="{ element }">
          <div @click="handleClick(element.name, $event)" class="inventoryCard">
            <div class="card-quantity">x{{ element.itemArr.reduce((tol, cur) => tol + cur.count, 0) }}</div>
            <h4>{{ itemCardData[element.name].transName }}
            </h4>
            fre:{{ element.itemArr[0].freshness ? ((element.itemArr[0].freshness / element.itemArr[0].totalFreshness
              *
              100).toFixed()) + '%' : `INF%` }}
            <button @click.stop="selectItemForInteraction(element.name)">
              使用
            </button>
          </div>
        </template>
      </draggable>
    </div>

  </div>
</template>

<style scoped>
@media (max-width: 600px) {
  .inventoryCard {
    max-width: calc(50% - 10px);
    /* 当屏幕较小时，只显示两列 */
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 400px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}


.itemFunctionContainer {
  width: 100%;
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
}

.itemFunction {
  flex: 1;
  margin: 6px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: calc(33.33% - 10px);
  /* 将卡片最大宽度设为容器的三分之一，减去间隙 */
  min-width: 80px;
  /* 设置一个最小宽度以确保内容不会挤压 */
}


.inventoryContainer {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 0 5px;
  border: #fff 1px solid;
  height: 130px;
  align-items: center;
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  flex-wrap: nowrap;
}

.inventoryCard {
  margin: 10px 5px 0 5px;
  height: 110px;
  flex:0 0 60px;
  position: relative;
  /* 为数量标签设置相对定位上下文 */
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  padding: 5px;
  /* 添加间隙 */
  background: #fff;
  /* 朴素的白色背景 */
}

.card-quantity {
  position: absolute;
  z-index: 1;
  top: -10px;
  /* 一部分在卡片外 */
  right: -10px;
  /* 一部分在卡片外 */
  width: 30px;
  height: 30px;
  background: #f5f5f5;
  /* 朴素的背景颜色 */
  border-radius: 50%;
  /* 圆形 */
  border: 2px solid #e0e0e0;
  /* 边框 */
  color: #333;
  /* 字体颜色 */
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.inventoryCard h3 {
  font-size: 1.5em;
  margin-bottom: 10px;
}

.inventoryCard button {
  width: 100%;
  background-color: #98ea78;
  /* 绿色 */
  border: none;
  border-radius: 5px;
  color: white;
  padding: 6px 8px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  margin-top: 10px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.inventoryCard button:hover {
  background-color: #45a049;
}

.characterCard {
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  padding: 15px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.characterCard h2 {
  font-size: 1.5em;
  margin-bottom: 10px;
}

.ghost {
  position: relative;
}

.ghost ::before {
  content: "";
  /* 为伪元素设置内容，使其可见 */
  position: absolute;
  /* 使用绝对定位 */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgb(234, 234, 234);
  /* 设置背景颜色为灰色 */
  z-index: 1;
  /* 确保伪元素在内容上方 */
}

.ghost .card-quantity {
  display: none;
}

.drag {
  background: white;
  opacity: 1 !important;
}
</style>
