import requests
from bs4 import BeautifulSoup
import mysql.connector
from mysql.connector import Error

# 网页解析部分
url = "https://metrics.torproject.org/collector/recent/relay-descriptors/microdescs/consensus-microdesc/"

try:
    response = requests.get(url)
    response.raise_for_status()  # 检查请求是否成功

    soup = BeautifulSoup(response.text, 'html.parser')

    # 查找表格
    table = soup.find('table')

    if table:
        # 查找表格中的 <tbody>
        tbody = table.find('tbody')
        if tbody:
            # 查找表格中的所有行
            rows = tbody.find_all('tr')
            cols = rows[1].find_all('td')
            # 获取到了最新的时间 latest_time
            latest_time = cols[1].get_text(strip=True)
            print(latest_time)

        else:
            print("No tbody found in the table.")
    else:
        print("No table found on the page.")

except requests.exceptions.RequestException as e:
    print(f"An error occurred: {e}")

# 数据库操作部分
try:
    # 创建数据库连接
    connection = mysql.connector.connect(
        host='96.30.195.99',  # 数据库主机地址
        user='remote_user',  # 数据库用户名
        password='root',  # 数据库密码
        database='exploring_the_abyss'  # 数据库名称
    )

    if connection.is_connected():
        # 获取数据库服务器信息
        db_info = connection.get_server_info()
        print("成功连接到数据库，版本为：", db_info)

        # 创建游标对象
        cursor = connection.cursor()

        # 创建表格（如果不存在）
        create_table_query = """
        CREATE TABLE IF NOT EXISTS latest_time (
            time_value VARCHAR(255) NOT NULL
        )
        """
        cursor.execute(create_table_query)
        print("表格创建成功（如果不存在）")

        # 删除现有数据（如果存在）
        delete_query = "DELETE FROM latest_time"
        cursor.execute(delete_query)

        # 插入新数据
        insert_query = "INSERT INTO latest_time (time_value) VALUES (%s)"
        cursor.execute(insert_query, (latest_time,))
        connection.commit()  # 提交事务
        print("数据插入成功")

        # 查询并打印表中的数据
        select_query = "SELECT * FROM latest_time"
        cursor.execute(select_query)
        result = cursor.fetchall()
        # 打印表中的列名
        print("{:<15}".format("time_value"))
        print("-" * 15)
        # 打印查询结果
        for row in result:
            print("{:<15}".format(row[0]))

except Error as e:
    print("连接数据库时出错：", e)

finally:
    # 关闭数据库连接
    if connection.is_connected():
        cursor.close()
        connection.close()
        print("数据库连接已关闭")