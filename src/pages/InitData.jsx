import React from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const InitData = () => {
  const commonItems = [
    "滅火器有效期限", "消防設備外觀", "緊急照明或出口指示",
    "地面清潔", "是否有積水", "是否有異味",
    "照明是否正常", "門禁或鎖具是否正常", "CCTV或監視設備是否正常"
  ];

  const locations = [
    { name: "泳池", special: ["水質清澈度", "救生設備", "防滑狀況", "排水溝", "警示標語"] },
    { name: "2樓健身房", special: ["器材安全", "器材螺絲固定", "地墊清潔", "冷氣通風", "使用規範公告"] },
    { name: "2樓桌球室", special: ["桌球桌狀況", "球網固定", "地面防滑", "照明亮度"] },
    { name: "2樓家教室", special: ["桌椅完整", "白板清潔", "插座安全", "冷氣照明"] },
    { name: "2樓休息室", special: ["沙發桌椅", "環境整潔", "空調照明", "公共用品"] },
    { name: "14樓中繼水塔", special: ["水塔外觀", "水位狀況", "加壓馬達", "管線滲漏", "機房門鎖"] },
    { name: "26樓廚房", special: ["冰箱溫度", "食材保存", "油水分離槽", "排水溝", "抽油煙機", "瓦斯安全", "調味料封存", "廚房地面清潔"] },
    { name: "頂樓水池", special: ["水池蓋密合", "水池周邊清潔", "防墜安全", "管線滲漏", "水位狀況"] },
    { name: "B棟頂樓", special: ["排水孔", "防水層", "女兒牆", "門鎖", "雜物堆置"] },
    { name: "安全梯", special: ["通道是否暢通", "防火門是否關閉", "緊急照明", "樓梯扶手", "是否堆放雜物"] },
    { name: "後哨", special: ["門禁紀錄", "訪客登記", "CCTV畫面", "緊急聯絡表", "值班日誌", "哨所清潔"] },
    // 補齊至 16 個點 (範例補位，可自行修改名稱)
    { name: "1樓大廳", special: ["對講機系統", "信箱區整潔", "自動門運作"] },
    { name: "B1停車場", special: ["車位佔用檢查", "截流槽清潔", "緊急呼叫鈕"] },
    { name: "B2停車場", special: ["照明度", "牆面滲漏", "一氧化碳偵測器"] },
    { name: "垃圾處理場", special: ["回收分類", "廚餘桶密封", "消毒紀錄"] },
    { name: "中庭花園", special: ["植栽修剪", "噴水池狀況", "步道平整"] }
  ];

  const handleInit = async () => {
    try {
      for (const loc of locations) {
        await addDoc(collection(db, "locations"), {
          name: loc.name,
          checkItems: [...commonItems, ...loc.special], // 結合通用與特殊項目
          createdAt: serverTimestamp()
        });
      }
      alert("16 個巡檢地點初始化成功！");
    } catch (e) {
      console.error(e);
      alert("初始化失敗，請檢查權限設定。");
    }
  };

  return (
    <div className="p-20 bg-slate-900 min-h-screen text-white text-center">
      <h1 className="text-2xl font-bold mb-4">資料庫初始化工具</h1>
      <button 
        onClick={handleInit}
        className="bg-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-500 transition"
      >
        按此一次建立 16 個巡檢點
      </button>
    </div>
  );
};

export default InitData;