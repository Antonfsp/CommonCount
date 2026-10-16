namespace CommonCount.Application.Common;


public class Result<T>
{
    public bool IsSuccess { get; private set; }
    public string? Error { get; private set; }
    public ResultErrorType? ErrorType { get; private set; }
    public T? Value { get; private set; }

    private Result(bool isSuccess, T? value, string? error, ResultErrorType? errorType)
    {
        IsSuccess = isSuccess;
        Value = value;
        Error = error;

    }

    public static Result<T> Ok(T value) => new(true, value, null, null);
    public static Result<T> Fail(
    string error,
    ResultErrorType errorType = ResultErrorType.Validation) =>
    new(false, default, error, errorType);
}

public enum ResultErrorType
{
    Validation,
    Conflict,
    NotFound
}
