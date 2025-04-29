import paramiko
import csv
import os
import ipaddress
import mysql.connector
from mysql.connector import Error

# 远程服务器信息
hostname = '96.30.195.99'  # VPS地址
port = 22  # 默认SSH端口
username = 'root'
password = '(t8N=j#M@Defa@?n'  # 密码或使用密钥认证

def is_ip_alive_remote(ssh, ip):
    try:
        # 根据远程服务器的操作系统选择 ping 命令的参数
        command = f"ping -c 1 -w 1 {ip}"
        stdin, stdout, stderr = ssh.exec_command(command)
        exit_status = stdout.channel.recv_exit_status()
        return exit_status == 0
    except Exception as e:
        print(f"Error pinging IP {ip}: {e}")
        return False

def scan_c_class_remote(ssh, ip):
    try:
        # 获取目标 IP 的 C 段网络
        network = ipaddress.ip_network(f"{ip}/24", strict=False)
        results = []
        alive_count = 0  # 记录存活IP的数量

        for host in network.hosts():
            alive = is_ip_alive_remote(ssh, str(host))
            results.append((str(ip), str(host), alive))

            if alive:
                alive_count += 1
                print(f"Found alive IP: {host} (count: {alive_count})")

            # 如果存活IP数量达到5，停止扫描
            if alive_count >= 5:
                print(f"Found 5 alive IPs in {ip}, stopping scan.")
                break

        return results
    except ValueError:
        return []

def scan_c_class_remote2(ssh, ip):
    try:
        # 获取目标 IP 的 C 段网络
        network = ipaddress.ip_network(f"{ip}/24", strict=False)
        results = []
        alive_count = 0  # 记录存活IP的数量
        dead_count = 0   # 记录未存活IP的数量
        top5_alive_ips = []  # 记录前5个存活的IP

        for host in network.hosts():
            alive = is_ip_alive_remote(ssh, str(host))
            results.append((str(ip), str(host), alive))

            if alive:
                alive_count += 1
                print(f"Found alive IP: {host} (count: {alive_count})")
                # 记录前5个存活的IP
                if len(top5_alive_ips) < 5:
                    top5_alive_ips.append(str(host))
            else:
                dead_count += 1

        # 返回原始IP、存活数、未存活数和前五个存活的IP
        return {
            "original_ip": str(ip),
            "alive_count": alive_count,
            "dead_count": dead_count,
            "top5_alive_ips": top5_alive_ips
        }
    except ValueError:
        return {
            "original_ip": str(ip),
            "alive_count": 0,
            "dead_count": 0,
            "top5_alive_ips": []
        }

def read_ips_from_file(file_path):
    ips = []
    with open(file_path, 'r', encoding='utf-8') as file:
        reader = csv.reader(file)
        for row in reader:
            if row:  # 确保行不为空
                ips.append(row[0].strip())  # 假设IP地址在第一列
    return ips

def write_results_to_csv(results, output_file, mode='a'):
    with open(output_file, mode, newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        if mode == 'w':  # 如果是写入模式，写入表头
            writer.writerow(['Source IP', 'C Class IP', 'Is Alive'])
        writer.writerows(results)

def scan_first_ip_c_class(input_file, output_dir):
    """
    扫描输入文件中第一个IP的C段，并将结果写入以“Source IP”命名的CSV文件中。
    """
    # 创建 SSH 客户端并连接
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        ssh.connect(hostname, port, username, password)
        print("已连接到远程服务器")

        # 从文件中读取IP地址列表
        ips = read_ips_from_file(input_file)
        if not ips:
            print("输入文件中没有IP地址")
            return

        first_ip = ips[0]
        print(f"开始扫描第一个IP: {first_ip}")

        # 获取C段扫描结果
        results = scan_c_class_remote(ssh, first_ip)

        #存入数据库的结果**********************************************************
        results2 = scan_c_class_remote2(ssh, first_ip)
        # 将数据存入数据库
        save_to_database(results2)

        # 生成输出文件名
        output_filename = f"{first_ip.replace('.', '_')}_c.csv"
        output_path = os.path.join(output_dir, output_filename)

        # 写入结果
        write_results_to_csv(results, output_path, mode='w')

        print(f"扫描结果已保存到: {output_path}")

    except Exception as e:
        print(f"发生错误：{e}")
    finally:
        ssh.close()
        print("已断开与远程服务器的连接")

def save_to_database(result):
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

            # 创建表格（如果不存在）
            create_table_query = """
            CREATE TABLE IF NOT EXISTS c_class_alive (
                id INT AUTO_INCREMENT PRIMARY KEY,
                original_ip VARCHAR(255) NOT NULL,
                alive_count INT NOT NULL,
                dead_count INT NOT NULL,
                host1 VARCHAR(255),
                host2 VARCHAR(255),
                host3 VARCHAR(255),
                host4 VARCHAR(255),
                host5 VARCHAR(255)
            )
            """
            cursor.execute(create_table_query)
            print("表格创建成功（如果不存在）")

            # 删除现有数据（如果存在）
            delete_query = "DELETE FROM c_class_alive"
            cursor.execute(delete_query)

            # 提取前五个存活的IP，不足五个时填充NULL
            top5_hosts = result['top5_alive_ips'] + [None] * (5 - len(result['top5_alive_ips']))

            # 插入新数据
            insert_query = """
            INSERT INTO c_class_alive (original_ip, alive_count, dead_count, host1, host2, host3, host4, host5)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (
                result['original_ip'],
                result['alive_count'],
                result['dead_count'],
                top5_hosts[0],
                top5_hosts[1],
                top5_hosts[2],
                top5_hosts[3],
                top5_hosts[4]
            ))
            connection.commit()  # 提交事务
            print("数据插入成功")

    except Error as e:
        print("连接数据库时出错：", e)
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("数据库连接已关闭")

if __name__ == "__main__":
    # 如果直接运行此文件，可以测试功能
    scan_first_ip_c_class("数据/target_ip.csv", "数据")