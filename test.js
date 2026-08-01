const compressImage = require('./compress.js');

// 呼叫compressImage函式，等它處理完後，把它的回傳結果印出來
compressImage('input.jpg', 'output.webp', 50, 300) 
  .then((result) => {
    console.log(result);
  });

compressImage('input.jpg', 'output2.webp', 50, 9999)
  .then((result) => {
    console.log('測試2 (width 超大):', result);
  });

compressImage('input.jpg', 'output3.webp', undefined, 300)
  .then((result) => {
    console.log('測試3 (沒傳 quality,應該自動用 80):', result);
  });

compressImage('input.jpg', 'output4.jpg', 80, undefined, 'jpeg')
  .then((result) => {
    console.log('測試4 (指定輸出 jpeg):', result);
  });

compressImage('input.jpg', 'output5.jpg', 80, undefined, 'jpeg')
  .then((result) => {
    console.log('測試5 (驗證 warning 機制):', result);
  });