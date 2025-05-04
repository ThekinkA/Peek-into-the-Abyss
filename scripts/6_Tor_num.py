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
        return response.text
    except Exception as e:
        print(f"Request error: {e}")
        return None

def parse_html_content(content):
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
    with open(filename, 'w', encoding='utf-8') as file:
        file.write(content)

def extract_valid_after_time(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        for line in file:
            if line.startswith("valid-after"):
                return line.split("valid-after")[1].strip()
    return None

def count_ips_in_files(folder):
    results = []  # 用于存储每个文件的统计结果

    for filename in os.listdir(folder):
        if filename.startswith("content_") and filename.endswith(".txt"):
            file_path = os.path.join(folder, filename)
            print(f"统计文件 {filename}")
            ips = count_ips_in_file(file_path)
            print(f"有效 IP 数量：{ips}")
            valid_after_time = extract_valid_after_time(file_path)
            print(f"valid-after 时间：{valid_after_time}")
            results.append({"valid_after_time": valid_after_time, "ip_num": ips})

    return results

def count_ips_in_file(filename):
    count = 0
    time_pattern = re.compile(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}')
    ip_pattern = re.compile(r'^r \S+ \S+ ' + time_pattern.pattern + r' \d+\.\d+\.\d+\.\d+ \d+ \d+$')
    with open(filename, "r", encoding="utf-8") as file:
        for line in file:
            if ip_pattern.match(line.strip()):
                count += 1
    return count

def save_to_database(results):
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
                valid_after_time DATETIME,
                ip_num INT
            )
            """
            cursor.execute(create_table_query)
            print("表格创建成功（如果不存在）")

            # 删除现有数据（如果存在）
            delete_query = "DELETE FROM ip_counts"
            cursor.execute(delete_query)

            # 插入新数据
            insert_query = """
            INSERT INTO ip_counts (valid_after_time, ip_num)
            VALUES (%s, %s)
            """
            for result in results:
                cursor.execute(insert_query, (result["valid_after_time"], result["ip_num"]))
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
            print("{:<20} {:<10}".format("valid_after_time", "ip_num"))
            print("-" * 35)

            # 打印查询结果
            for row in result:
                valid_after_time = row[0].strftime("%Y-%m-%d %H:%M:%S") if row[0] else "None"
                print("{:<20} {:<10}".format(valid_after_time, row[1]))

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
    print(results)  # 打印包含每个文件统计结果的字典

    # 将数据存入数据库
    save_to_database(results)
    # 打印数据库表内容
    print_database_table()

if __name__ == "__main__":
    main()