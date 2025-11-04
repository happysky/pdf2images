$(function(){
  //保留固定小数位数
  const toFixedNumber = (num, digits = 3, base) => {
    const pow = Math.pow(base ?? 10, digits);
    return Math.round(num * pow) / pow;
  };
  const app = {
    init: function(){
      this.bindEvent();
    },
    bindEvent: function(){
      const form = $('form');
      const actionPython = "/convert";
      const actionNode = "/node/convert";
      const actionMupdf = "/mupdfjs/convert";
      const container = $('#container div');
      const submit = (type, action, container)=>{
        const start = Date.now();
        container.html(`<div class="loading">loading</div>`);
        $.ajax({
          type: "POST",
          url: action,
          data: new FormData(form[0]),
          contentType: false, 
          processData: false, 
          success: function(res){
            const end = Date.now();
            const { error,  data} = res;
            const { md5, page_count, used_time, page_number } = data;
            console.log('data', data);
            const analysis_page_count = page_number >= 1 ? 1 : page_count
            const per_page_used_time = toFixedNumber(used_time / analysis_page_count, 2)
            const paths = {
              'PyMuPDF': '',
              'pdf-js': '/node',
              'mupdf-js': '/mupdfjs'
            }
            const nodePath = paths[type] || '';
            const htmls = [
              `<b>${type}</b>：共${page_count}页，解析${analysis_page_count}页，单页耗时<b>${per_page_used_time}ms</b>，总耗时：服务端：<b>${used_time}ms</b>，前端：${end-start}ms`,
              `<hr/>`
            ];
            if(page_number >= 1){
              htmls.push(`第${page_number}页`)
              htmls.push(`<hr/>`);
              htmls.push(`<img src="${nodePath}/pdfs/${md5}/${page_number}.jpeg" />`)
            }else{

              for(let i=0;i<page_count; i++){
                htmls.push(`第${i+1}页`)
                htmls.push(`<hr/>`);
                htmls.push(`<img src="${nodePath}/pdfs/${md5}/${i+1}.jpeg" />`)
              }
            }
            container.html(htmls.join(""));
          },
          dataType: 'json'
        });
      }
      form.on('submit', function(e){
        e.preventDefault();
        submit('PyMuPDF', actionPython, $(container[0]));
        submit('pdf-js', actionNode, $(container[1]));
        submit('mupdf-js', actionMupdf, $(container[2]));
      })
    }
  }

  app.init();
})