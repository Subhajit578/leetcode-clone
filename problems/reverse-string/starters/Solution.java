import java.util.Scanner;

public class Solution {
    public static String reverseString(String s) {
        // Write your code here
        return "";
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String line = sc.nextLine().trim();
        String s = line.substring(1, line.length() - 1);
        String result = reverseString(s);
        System.out.println("\"" + result + "\"");
    }
}