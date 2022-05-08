## 使用说明

1. 要正常使用该仓库，需
  - 自创证书或者将 Docker仓库中的ES证书复制出来
如：使用docker compose命令 
    ```
    docker compose cp es01:/usr/share/elasticsearch/config/certs ./certs
    ```
    需注意的是，为了向前兼容，这里我使用了Docker Compose CLI V2，如果V1不支持cp操作，可以用Docker其他命令代替 

    在文件夹找到`.ca`文件，并将该文件复制到此仓库中。并记下该文件相对仓库主目录路径。
  - 在仓库根目录创建`.env`文件并至设置以下内容
    ```
    # Required params:
    ES_USERNAME="CHANGEME" # default to "elastic"
    ES_PASSWORD="CHANGEME"
    CA_CERT="ca.crt"

    # Optional params:
    # ES_PORT="9200"
    # PROXY_PORT="3200"
    ```
## API部分

### /search?q=xxx

查询q对应的内容

查询方法：设定多字段查询，对分词器结果中最后一个词使用前缀查询，其他使用精确查询，查询的结果中设定标题权重为文本权重的两倍

```javascript
 query: {
          "multi_match": {       
            "query": q,
            "type": "bool_prefix",
            "fields": ["title^2", "plaintext"] 
          }
        },
```

对结果中对符合查询的部分高亮显示

设定res响应HTTP头

```javascript
res.set({
          "Access-Control-Allow-Origin": "http://localhost:3000",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type, x-requested-with"
        })
```

### /advanced_search?q=xxx

可选参数（include, exclude, publishingDate1, publishingDate2, scrapyDate1, scrapyDate2, infoSource, containAttachment）

`include`:搜索查询结果包含include的内容

`exclude`:排除查询结果中含有exclude的内容

`publishingDate1`, `publishingDate2`, `scrapyDate1`, `scrapyDate2`:设定文章公开或者爬取的时间，默认为1788/01/01到查询时间点

`infoSource`:查询由用户确定的信息源

`containAttachment`:利用painless脚本判断返回内容是否需要有附件

查询q对应的内容并在结果中对符合查询的部分高亮显示

设定res响应HTTP头

### /article?q=xxx

查询文章标题中的关键词

设定res响应HTTP头

## Looking Forward
之后我会将四个仓库合并，用Docker Command完成所有操作