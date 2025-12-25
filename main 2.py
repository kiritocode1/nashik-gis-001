# Given an array and k
# return true if sum of any three numbers =k
# If no such combination exist, return false
# Ex:
# [1, 2, 3, 4] k = 6 -> True
# k=10 -> False


def three_sum_exists(arr: list[int], k: int) -> bool:
    """
    Check if any three numbers in array sum to k.
    Time: O(n²), Space: O(1)
    """
    n = len(arr)
    if n < 3:
        return False
    
    arr.sort()  # O(n log n)
    
    for i in range(n - 2):
        left = i + 1
        right = n - 1
        
        while left < right:
            current_sum = arr[i] + arr[left] + arr[right]
            
            if current_sum == k:
                return True
            elif current_sum < k:
                left += 1
            else:
                right -= 1
    
    return False


# Test cases
if __name__ == "__main__":
    # Example 1: [1, 2, 3, 4] k = 6 -> True (1+2+3=6)
    print(three_sum_exists([1, 2, 3, 4], 6))  # True
    
    # Example 2: [1, 2, 3, 4] k = 10 -> False
    print(three_sum_exists([1, 2, 3, 4], 10))  # False