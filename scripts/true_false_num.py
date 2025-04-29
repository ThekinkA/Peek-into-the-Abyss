import requests
import mysql.connector
from mysql.connector import Error
def count_true_false(url):
    try:
        # 尝试获取网页内容
        response = requests.get(url)

        # 检查请求是否成功
        if response.status_code == 200:
            content = response.text

            # 统计true和false的出现次数
            true_count = content.count("true")
            false_count = content.count("false")

            print(f"成功获取内容！")
            print(f"'true'出现次数：{true_count}")
            print(f"'false'出现次数：{false_count}")

            # 将数据存入数据库
            save_to_database(true_count, false_count)
        else:

            print(f"请求失败，状态码：{response.status_code}")

    except requests.exceptions.RequestException as e:
        print(f"请求过程中出现错误：{e}")
        print("请检查网络连接或链接的合法性。")

def save_to_database(true_count, false_count):
    try:
        # 创建数据库连接
        connection = mysql.connector.connect(
            host='96.30.195.99',  # 数据库主机地址
            user='remote_user',  # 数据库用户名
            password='root',  # 数据库密码
            database='exploring_the_abyss'  # 数据库名称
        )

        if connection.is_connected():
            cursor = connection.cursor()

            # 创建表格（如果不存在）
            create_table_query = """
            CREATE TABLE IF NOT EXISTS true_false_counts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                true_count INT,
                false_count INT
            )
            """
            cursor.execute(create_table_query)
            print("表格创建成功（如果不存在）")

            # 删除现有数据（如果存在）
            delete_query = "DELETE FROM true_false_counts"
            cursor.execute(delete_query)

            # 插入新数据
            insert_query = """
            INSERT INTO true_false_counts (true_count, false_count)
            VALUES (%s, %s)
            """
            cursor.execute(insert_query, (true_count, false_count))
            connection.commit()  # 提交事务
            print("数据插入成功")

    except Error as e:
        print("连接数据库时出错：", e)

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("数据库连接已关闭")

def print_database_table():
    connection = None
    try:
        connection = mysql.connector.connect(
            host='96.30.195.99',  # 数据库主机地址
            user='remote_user',  # 数据库用户名
            password='root',  # 数据库密码
            database='exploring_the_abyss'  # 数据库名称
        )

        if connection and connection.is_connected():
            cursor = connection.cursor()

            # 查询表内容
            select_query = "SELECT * FROM true_false_counts"
            cursor.execute(select_query)
            result = cursor.fetchall()

            # 打印表中的列名
            print("{:<10} {:<15} {:<15}".format("id", "true_count", "false_count"))
            print("-" * 40)

            # 打印查询结果
            for row in result:
                print("{:<10} {:<15} {:<15}".format(row[0], row[1], row[2]))

    except Error as e:
        print("连接数据库时出错：", e)
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("数据库连接已关闭")

def main():
    url = "https://onionoo.torproject.org/summary"
    count_true_false(url)
    # 打印数据库表内容
    print_database_table()

if __name__ == "__main__":
    main()