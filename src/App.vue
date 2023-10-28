<script setup>
import itemCardData from './assets/excelData/itemCard.json';
import createItemFunction from './basic/createItemFunction.js';
import { RouterLink, RouterView } from 'vue-router'
import draggable from 'vuedraggable'
import { computed, ref, toRaw, reactive } from 'vue'
import HelloWorld from './components/HelloWorld.vue'

//玩家属性
const player = reactive({
  hungerLevel: 100, // 饥饿程度
  diarrheaLevel: 0, // 拉肚子的程度
  hydrationLevel: 100, // 水分程度
  bodyTemperature: 36.5, // 体温
  timeOfDay: 0, // 一天中的分钟数，早上0点开始
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
])


// 用于追踪交互模式
const interactionMode = ref(false);
const cardClickTimer = null;

console.log(itemCardData);

//单击打开物品信息
const selectedItemInfo = reactive({
  name: '',
  transName:'',
  description: '',
  function: null,//物品功能
  details: null  // 更多的详细信息可以在此处添加
});
const isModalOpen = ref(false);

const itemFunction = createItemFunction(playerInventory, player,isModalOpen)


// 单击卡片显示更多信息
function handleClick(itemName, e) {

  // 弹出一个信息框，显示物品的详细信息
  const itemDetails = itemCardData[itemName];
  selectedItemInfo.name = itemName;
  selectedItemInfo.transName = itemDetails.transName;
  selectedItemInfo.description = itemDetails.description;
  selectedItemInfo.function = [];
  if (itemDetails.function) {
    itemDetails.function.split(',').forEach((item) => {
      selectedItemInfo.function.push(itemFunction[item])
    })
  }

  console.log('selectedFunction', toRaw(selectedItemInfo.function))
  // 如果有更多的详细信息，您可以在此处添加
  isModalOpen.value = true;  // 打开模态窗口
  console.log('handleClick', itemName, e.srcElement, selectedItemInfo);

}

// 双击事件处理
function selectItemForInteraction(itemName) {
  console.log('activateInteractionMode', itemName)
  if (selectedItemInfo.value && selectedItemInfo.value !== itemName) {
    // 如果已经有选中的物品，那么执行交互逻辑
    // ...

    // 交互完成后，清除选中状态
    selectedItemInfo.value = null;
  } else {
    // 否则，设置此物品为选中状态
    selectedItemInfo.value = itemName;
  }
  interactionMode.value = !interactionMode.value;
  selectedItemInfo.value = itemName;
}

const itemCard = itemCardData

function searchForItem() {
  const chance = Math.random();
  if (chance <= 0.5) {
    //从itemCard对象中随机选一个

    const randomIndex = Math.floor(Math.random() * itemCard.length);
    const foundItem = itemCard[randomIndex];
    addItemToInventory(foundItem, 1)
    console.log(`你找到了一个 ${foundItem}!`);
  } else {
    console.log("你没有找到任何东西...");
  }

  // 搜寻食物会消耗时间和体力
  player.timeOfDay += 15;
  player.hungerLevel -= 5
  player.hydrationLevel -= 5

  if (player.timeOfDay >= 720 && player.timeOfDay < 1080) {
    // 如果是中午，因为天气炎热，体温会升高，消耗更多水分
    player.bodyTemperature += 0.5;
    player.hydrationLevel -= 5;
  } else if (player.timeOfDay >= 1080 || player.timeOfDay < 360) {
    // 如果是晚上，因为可见度不够，寻找食物会消耗更多时间
    player.timeOfDay += 5;
  }

  // 检查角色状态
  checkPlayerStatus();
}

function addItemToInventory(item, quantity) {
  if (playerInventory.hasOwnProperty(item)) {
    playerInventory[item].push({
      count: quantity,
      freshness: itemCardData[item].freshness,
      totalFreshness: itemCardData[item].freshness
    })
  } else {
    playerInventory[item] = [{
      count: quantity,
      freshness: itemCardData[item].freshness,
      totalFreshness: itemCardData[item].freshness
    }]
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

function dragEnd(e) {
  console.log('dragEnd', e)
}
</script>

<template>
  <div v-if="isModalOpen" class="modal-overlay" @click="isModalOpen = false">
    <div class="modal-content" @click.stop>
      <h2>{{ selectedItemInfo.transName }}</h2>
      <p>{{ selectedItemInfo.description }}</p>
      <div class="itemFunctionContainer">
        <template v-for="func in selectedItemInfo.function">
          <button class="itemFunction" @click="func.fn(selectedItemInfo.name)">
            {{ func.transName }}
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
      <p>时间: {{ formatTime(player.timeOfDay) }}</p>
      <p>饥饿度: {{ player.hungerLevel }}%</p>
      <p>口渴度: {{ player.hydrationLevel }}%</p>
      <p>体温: {{ player.bodyTemperature }}度</p>
      <p>腹泻值: {{ player.diarrheaValue }}%</p>
      <button @click="searchForItem">
        <h2>寻找食物</h2>
      </button>

    </div>

    <!-- 物品卡片 -->
    <div>
      <h2>物品栏:</h2>
      <draggable :list="playerInventory" group="playerInv" item-key="name" class="inventoryContainer" delay="200"
        swapThreshold="1" ghostClass="ghost" dragClass="drag" touchStartThreshold="50" animation="100"
        @start="console.log('start')" @end="dragEnd">
        <template #item="{ element }">
          <div @click="handleClick(element.name, $event)" class="inventoryCard">
            <h4>{{ itemCardData[element.name].transName }} x{{ element.itemArr.reduce((tol, cur) => tol + cur.count, 0) }}
            </h4>
            <div>fre:{{ element.itemArr[0].freshness ? ((element.itemArr[0].freshness / element.itemArr[0].totalFreshness
              *
              100).toFixed()) + '%' : `INF%` }}</div>
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
  min-width: 50px;
  /* 设置一个最小宽度以确保内容不会挤压 */
}


.inventoryContainer {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  display: flex;
  flex-wrap: nowrap;
  /* 间隙可以根据需要调整 */
  /* justify-content: center; */
  /* 如果你希望卡片在容器中居中 */
}

.inventoryCard {
  flex: 1;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: calc(33.33% - 10px);
  /* 将卡片最大宽度设为容器的三分之一，减去间隙 */
  min-width: 50px;
  /* 设置一个最小宽度以确保内容不会挤压 */
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
  margin-top: 10px ;
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
  background-color: #e0e0e0;
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

.drag {
  background: white;
  opacity: 1 !important;
}
</style>
