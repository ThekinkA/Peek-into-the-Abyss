import requests
from bs4 import BeautifulSoup
import os
import re
from urllib.parse import urljoin
import mysql.connector
from mysql.connector import Error
def get_url_content(url):

    try:
        response = requests.get(url)
        response.raise_for_status()
        #print(response.text)
        return response.text
    except Exception as e:
        print(f"Request error: {e}")
        return None

def parse_html_content(content):
    """
    解析HTML内容，返回表格的前六个链接的href属性列表
    """
    soup = BeautifulSoup(content, 'html.parser')
    table = soup.find('table')
    links = []
    if table:
        tbody = table.find('tbody')
        if tbody:
            rows = tbody.find_all('tr')[:7]
            for row in rows:
                td = row.find('td')
                if td:
                    a_tag = td.find('a', href=True)
                    if a_tag and 'href' in a_tag.attrs:
                        links.append(a_tag['href'])
    return links

def save_to_file(content, filename):
    """
    将内容保存到文件
    """
    with open(filename, 'w', encoding='utf-8') as file:
        file.write(content)

def count_ips_in_files(folder):
    total_ips = 0
    results = {}  # 用于存储每个文件的统计结果

    for filename in os.listdir(folder):
        if filename.startswith("content_") and filename.endswith(".txt"):
            file_path = os.path.join(folder, filename)
            print(f"统计文件 {filename}")
            ips = count_ips_in_file(file_path)
            print(f"有效 IP 数量：{ips}")
            results[filename] = ips  # 将所有结果存储在字典中
            total_ips += ips

    print(f"所有文件的有效 IP 总数：{total_ips}")
    return results  # 返回包含所有文件统计结果的字典

def count_ips_in_file(filename):
    count = 0
    # 匹配时间格式：YYYY-MM-DD HH:MM:SS
    time_pattern = re.compile(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}')
    # 匹配整行格式，确保包含时间信息
    ip_pattern = re.compile(r'^r \S+ \S+ ' + time_pattern.pattern + r' \d+\.\d+\.\d+\.\d+ \d+ \d+$')
    with open(filename, "r", encoding="utf-8") as file:
        for line in file:
            if ip_pattern.match(line.strip()):
                count += 1
    return count

def save_to_database(ip_num1, ip_num2, ip_num3, ip_num4, ip_num5, ip_num6):
    try:
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
            CREATE TABLE IF NOT EXISTS ip_counts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ip_num1 INT,
                ip_num2 INT,
                ip_num3 INT,
                ip_num4 INT,
                ip_num5 INT,
                ip_num6 INT
            )
            """
            cursor.execute(create_table_query)
            print("表格创建成功（如果不存在）")

            # 删除现有数据（如果存在）
            delete_query = "DELETE FROM ip_counts"
            cursor.execute(delete_query)

            # 插入新数据
            insert_query = """
            INSERT INTO ip_counts (ip_num1, ip_num2, ip_num3, ip_num4, ip_num5, ip_num6)
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (ip_num1, ip_num2, ip_num3, ip_num4, ip_num5, ip_num6))
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
    try:
        connection = mysql.connector.connect(
            host='96.30.195.99',  # 数据库主机地址
            user='remote_user',  # 数据库用户名
            password='root',  # 数据库密码
            database='exploring_the_abyss'  # 数据库名称
        )

        if connection.is_connected():
            cursor = connection.cursor()

            # 查询表内容
            select_query = "SELECT * FROM ip_counts"
            cursor.execute(select_query)
            result = cursor.fetchall()

            # 打印表中的列名
            print("{:<10} {:<10} {:<10} {:<10} {:<10} {:<10} {:<10}".format("id", "ip_num1", "ip_num2", "ip_num3", "ip_num4", "ip_num5", "ip_num6"))
            print("-" * 70)

            # 打印查询结果
            for row in result:
                print("{:<10} {:<10} {:<10} {:<10} {:<10} {:<10} {:<10}".format(row[0], row[1], row[2], row[3], row[4], row[5], row[6]))

    except Error as e:
        print("连接数据库时出错：", e)

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("数据库连接已关闭")

def main():
    data_folder = "数据1"
    folder = "数据1"

    base_url = "https://metrics.torproject.org/collector/recent/relay-descriptors/microdescs/consensus-microdesc"
    content = get_url_content(base_url)
    if content:
        links = parse_html_content(content)
        print(links)
        if links:
            for i, link in enumerate(links[1:]):
                full_url = urljoin(base_url, link)
                print(f"Processing URL {i+1}: {full_url}")
                response = get_url_content(full_url)
                if response:
                    filename = f"{data_folder}/content_{i+1}.txt"
                    save_to_file(response, filename)
        else:
            print("No links found.")
    else:
        print(f"Failed to retrieve content from {base_url}")

    # 统计有效ip数
    results = count_ips_in_files(folder)  # 获取统计结果
    # print(results)  # 打印包含每个文件统计结果的字典
    values = list(results.values())
    ip_num1, ip_num2, ip_num3, ip_num4, ip_num5, ip_num6 = values[:6]
    print(f"ip_num1: {ip_num1}")
    print(f"ip_num2: {ip_num2}")
    print(f"ip_num3: {ip_num3}")
    print(f"ip_num4: {ip_num4}")
    print(f"ip_num5: {ip_num5}")
    print(f"ip_num6: {ip_num6}")
    os.makedirs(data_folder, exist_ok=True)

    # 将数据存入数据库
    save_to_database(ip_num1, ip_num2, ip_num3, ip_num4, ip_num5, ip_num6)
    # 打印数据库表内容
    print_database_table()

if __name__ == "__main__":
    main()